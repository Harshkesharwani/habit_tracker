from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.db import IntegrityError
from datetime import datetime, date, timedelta

from django.http import HttpResponse
import csv
import io

from .models import Habit, Completion, Label, Challenge, PomodoroSession
from .serializers import (
    UserSerializer,
    SignupSerializer,
    LoginSerializer,
    HabitSerializer,
    CompletionSerializer,
    LabelSerializer,
    ChallengeSerializer,
    PomodoroSessionSerializer
)

# -------------------------------------------------------------
# AUTHENTICATION
# -------------------------------------------------------------

@api_view(['POST'])
@permission_classes([AllowAny])
def signup_view(request):
    serializer = SignupSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    token, _ = Token.objects.get_or_create(user=user)
    return Response({
        "token": token.key,
        "user": {
            "id": user.id,
            "name": f"{user.first_name} {user.last_name}".strip() or user.username,
            "email": user.email,
            "joinedDate": user.date_joined.strftime('%Y-%m-%d'),
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data['user']
    token, _ = Token.objects.get_or_create(user=user)
    return Response({
        "token": token.key,
        "user": {
            "id": user.id,
            "name": f"{user.first_name} {user.last_name}".strip() or user.username,
            "email": user.email,
            "joinedDate": user.date_joined.strftime('%Y-%m-%d'),
        }
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    # Invalidate token
    Token.objects.filter(user=request.user).delete()
    return Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    user = request.user
    return Response({
        "id": user.id,
        "name": f"{user.first_name} {user.last_name}".strip() or user.username,
        "email": user.email,
        "joinedDate": user.date_joined.strftime('%Y-%m-%d'),
    })


# -------------------------------------------------------------
# HABITS MANAGEMENT
# -------------------------------------------------------------

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def habits_list_create_view(request):
    target_date_str = request.query_params.get('date')
    selected_date = None
    if target_date_str:
        try:
            selected_date = datetime.strptime(target_date_str, '%Y-%m-%d').date()
        except ValueError:
            pass

    if request.method == 'GET':
        status_param = request.query_params.get('status', 'active').upper()
        category_param = request.query_params.get('category')

        if status_param == 'ALL':
            habits = Habit.objects.filter(user=request.user).exclude(status='TRASHED')
        else:
            habits = Habit.objects.filter(user=request.user, status=status_param)

        if category_param and category_param.upper() != 'ALL':
            from django.db.models import Q
            habits = habits.filter(Q(category__iexact=category_param) | Q(labels__name__iexact=category_param)).distinct()

        habits = habits.prefetch_related('labels', 'completions')
        serializer = HabitSerializer(habits, many=True, context={'request': request, 'selected_date': selected_date})
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        serializer = HabitSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        habit = serializer.save()
        return Response(HabitSerializer(habit, context={'request': request}).data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def habit_detail_view(request, pk):
    # Strictly enforce data ownership
    habit = get_object_or_404(Habit, pk=pk, user=request.user)

    if request.method == 'GET':
        serializer = HabitSerializer(habit, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'PATCH':
        serializer = HabitSerializer(habit, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        updated_habit = serializer.save()
        return Response(HabitSerializer(updated_habit, context={'request': request}).data, status=status.HTTP_200_OK)

    elif request.method == 'DELETE':
        permanent = request.query_params.get('permanent') == 'true'
        if permanent:
            habit.delete()
            return Response({"message": "Habit permanently deleted."}, status=status.HTTP_200_OK)
        else:
            # Move to trash (soft delete)
            habit.status = 'TRASHED'
            habit.save()
            return Response({"message": "Habit moved to trash."}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def habit_archive_view(request, pk):
    habit = get_object_or_404(Habit, pk=pk, user=request.user)
    habit.status = 'ARCHIVED'
    habit.save()
    return Response(HabitSerializer(habit, context={'request': request}).data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def habit_unarchive_view(request, pk):
    habit = get_object_or_404(Habit, pk=pk, user=request.user)
    habit.status = 'ACTIVE'
    habit.save()
    return Response(HabitSerializer(habit, context={'request': request}).data, status=status.HTTP_200_OK)


# -------------------------------------------------------------
# COMPLETIONS TRACKING
# -------------------------------------------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def habit_completions_list_view(request, pk):
    habit = get_object_or_404(Habit, pk=pk, user=request.user)
    completions = habit.completions.all()

    from_date = request.query_params.get('from')
    to_date = request.query_params.get('to')

    if from_date:
        completions = completions.filter(date__gte=from_date)
    if to_date:
        completions = completions.filter(date__lte=to_date)

    serializer = CompletionSerializer(completions, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def all_completions_view(request):
    # Returns all completions for all of current user's habits (for calendar matrix)
    completions = Completion.objects.filter(habit__user=request.user)
    serializer = CompletionSerializer(completions, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def habit_completion_date_view(request, pk, date_str):
    habit = get_object_or_404(Habit, pk=pk, user=request.user)

    try:
        parsed_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return Response({
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid date format. Use YYYY-MM-DD.",
                "details": {"date": "Format must be YYYY-MM-DD"}
            }
        }, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'PUT':
        # Prevent duplicates at data layer using update_or_create with unique_together constraint
        count = request.data.get('count')
        toggle = request.data.get('toggle', False)

        existing = Completion.objects.filter(habit=habit, date=parsed_date).first()

        if toggle:
            if existing:
                if existing.count >= habit.goal:
                    # Undo completion
                    existing.delete()
                    return Response({"message": "Completion undone.", "count": 0}, status=status.HTTP_200_OK)
                else:
                    existing.count += 1
                    existing.save()
                    return Response(CompletionSerializer(existing).data, status=status.HTTP_200_OK)
            else:
                comp = Completion.objects.create(habit=habit, date=parsed_date, count=1)
                return Response(CompletionSerializer(comp).data, status=status.HTTP_200_OK)
        else:
            if count is not None:
                try:
                    final_count = int(count)
                except (ValueError, TypeError):
                    return Response({
                        "error": {
                            "code": "VALIDATION_ERROR",
                            "message": "Completion count must be a valid integer.",
                            "details": {"count": "Must be an integer"}
                        }
                    }, status=status.HTTP_400_BAD_REQUEST)
            else:
                final_count = 1

            if final_count <= 0:
                if existing:
                    existing.delete()
                return Response({"message": "Completion removed.", "count": 0}, status=status.HTTP_200_OK)

            comp, created = Completion.objects.update_or_create(
                habit=habit,
                date=parsed_date,
                defaults={'count': final_count}
            )
            return Response(CompletionSerializer(comp).data, status=status.HTTP_200_OK)

    elif request.method == 'DELETE':
        # Undo completion
        comp = Completion.objects.filter(habit=habit, date=parsed_date).first()
        if comp:
            comp.delete()
        return Response({"message": "Completion removed successfully."}, status=status.HTTP_200_OK)


# -------------------------------------------------------------
# DASHBOARD AND STATISTICS
# -------------------------------------------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats_view(request):
    target_date_str = request.query_params.get('date')
    if target_date_str:
        try:
            target_date = datetime.strptime(target_date_str, '%Y-%m-%d').date()
        except ValueError:
            target_date = date.today()
    else:
        target_date = date.today()

    active_habits = Habit.objects.filter(user=request.user, status='ACTIVE')
    completions = Completion.objects.filter(habit__user=request.user)

    # Pre-map target date completions to avoid N+1 queries in loop
    target_completions = {
        c.habit_id: c.count for c in completions.filter(date=target_date)
    }

    completed_today_count = 0
    in_progress_count = 0
    overdue_count = 0

    for habit in active_habits:
        c_count = target_completions.get(habit.id, 0)
        goal = habit.goal or 1

        if c_count >= goal:
            completed_today_count += 1
        elif c_count > 0:
            in_progress_count += 1
        else:
            if habit.start_date and habit.start_date < target_date:
                overdue_count += 1

    # Dynamic streak calculation: set lookup in memory in O(1) per day
    completed_days_set = set(
        completions.filter(count__gt=0).values_list('date', flat=True)
    )

    streak = 0
    check_day = date.today()
    while True:
        if check_day in completed_days_set:
            streak += 1
            check_day -= timedelta(days=1)
        else:
            if check_day == date.today():
                check_day -= timedelta(days=1)
                continue
            break

    # Documented completion rate denominator:
    # Denominator: Total active habits for the user on this date.
    # Formula: (completed_today / total_active) * 100
    total_active = active_habits.count()
    habit_score = int(round((completed_today_count / total_active) * 100)) if total_active > 0 else 0

    return Response({
        "completedToday": completed_today_count,
        "inProgress": in_progress_count,
        "overdue": overdue_count,
        "total": total_active,
        "streak": streak,
        "habitScore": habit_score,
        "denominatorDescription": "Calculated as (completed_today / total_active_habits) * 100"
    }, status=status.HTTP_200_OK)


# -------------------------------------------------------------
# LABELS MANAGEMENT
# -------------------------------------------------------------

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def labels_list_create_view(request):
    if request.method == 'GET':
        labels = Label.objects.filter(user=request.user).prefetch_related('habits')
        serializer = LabelSerializer(labels, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        name = request.data.get('name', '').strip()
        color = request.data.get('color', '#0d9488')
        if not name:
            return Response({
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Label name is required.",
                    "details": {"name": "This field is required."}
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        label, created = Label.objects.get_or_create(user=request.user, name=name, defaults={'color': color})
        return Response(LabelSerializer(label).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def label_delete_view(request, pk):
    label = get_object_or_404(Label, pk=pk, user=request.user)
    label.delete()
    return Response({"message": "Label deleted successfully."}, status=status.HTTP_200_OK)


# -------------------------------------------------------------
# TRASH MANAGEMENT
# -------------------------------------------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def trash_list_view(request):
    trashed = Habit.objects.filter(user=request.user, status='TRASHED')
    serializer = HabitSerializer(trashed, many=True, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trash_restore_view(request, pk):
    habit = get_object_or_404(Habit, pk=pk, user=request.user, status='TRASHED')
    habit.status = 'ACTIVE'
    habit.save()
    return Response(HabitSerializer(habit, context={'request': request}).data, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def trash_delete_permanent_view(request, pk):
    habit = get_object_or_404(Habit, pk=pk, user=request.user, status='TRASHED')
    habit.delete()
    return Response({"message": "Habit permanently deleted."}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trash_empty_view(request):
    Habit.objects.filter(user=request.user, status='TRASHED').delete()
    return Response({"message": "Trash emptied."}, status=status.HTTP_200_OK)


# -------------------------------------------------------------
# CSV EXPORT
# -------------------------------------------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_csv_view(request):
    habits = Habit.objects.filter(user=request.user).prefetch_related('completions', 'labels')
    
    response = HttpResponse(content_type='text/csv')
    filename = f"habit_tracker_export_{date.today().isoformat()}.csv"
    response['Content-Disposition'] = f'attachment; filename="{filename}"'

    writer = csv.writer(response)
    writer.writerow([
        'Habit ID', 
        'Habit Name', 
        'Category / Area', 
        'Frequency', 
        'Target Goal', 
        'Color', 
        'Status', 
        'Start Date', 
        'End Date', 
        'Reminder Time',
        'Labels', 
        'Total Completions Logged',
        'Completion Dates Log (Date:Count)'
    ])

    for h in habits:
        completions = h.completions.all()
        total_count = sum(c.count for c in completions)
        comp_log = '; '.join(f"{c.date}:{c.count}" for c in completions)
        labels_str = ', '.join(l.name for l in h.labels.all())
        writer.writerow([
            h.id,
            h.name,
            h.category or 'General',
            h.frequency,
            h.goal,
            h.color,
            h.status,
            h.start_date.isoformat() if h.start_date else '',
            h.end_date.isoformat() if h.end_date else '',
            h.reminder_time or '',
            labels_str,
            total_count,
            comp_log
        ])

    return response


# -------------------------------------------------------------
# CHALLENGES
# -------------------------------------------------------------

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def challenges_list_create_view(request):
    if request.method == 'GET':
        challenges = Challenge.objects.filter(user=request.user)
        serializer = ChallengeSerializer(challenges, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        serializer = ChallengeSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        challenge = serializer.save()
        return Response(ChallengeSerializer(challenge).data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def challenge_detail_view(request, pk):
    challenge = get_object_or_404(Challenge, pk=pk, user=request.user)

    if request.method == 'GET':
        return Response(ChallengeSerializer(challenge).data)

    elif request.method == 'PATCH':
        serializer = ChallengeSerializer(challenge, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        return Response(ChallengeSerializer(updated).data)

    elif request.method == 'DELETE':
        challenge.delete()
        return Response({"message": "Challenge deleted."}, status=status.HTTP_200_OK)


# -------------------------------------------------------------
# POMODORO SESSIONS
# -------------------------------------------------------------

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def pomodoro_list_create_view(request):
    if request.method == 'GET':
        sessions = PomodoroSession.objects.filter(user=request.user)[:50]
        serializer = PomodoroSessionSerializer(sessions, many=True)
        from django.utils import timezone
        from django.db.models import Q
        today_utc = timezone.now().date()
        today_local = date.today()
        today_sessions = PomodoroSession.objects.filter(
            Q(user=request.user) & (Q(completed_at__date=today_utc) | Q(completed_at__date=today_local))
        ).distinct()
        today_minutes = sum(s.duration_minutes for s in today_sessions)
        return Response({
            "sessions": serializer.data,
            "todayCount": today_sessions.count(),
            "todayMinutes": today_minutes
        }, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        serializer = PomodoroSessionSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        session = serializer.save()
        return Response(PomodoroSessionSerializer(session).data, status=status.HTTP_201_CREATED)

