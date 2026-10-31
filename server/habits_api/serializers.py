from datetime import date
from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from .models import Habit, Completion, Label, Challenge, PomodoroSession

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined']


class SignupSerializer(serializers.Serializer):
    firstName = serializers.CharField(max_length=150, required=True)
    lastName = serializers.CharField(max_length=150, required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(min_length=6, write_only=True, required=True)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists() or User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def create(self, validated_data):
        email = validated_data['email']
        user = User.objects.create_user(
            username=email,
            email=email,
            first_name=validated_data['firstName'],
            last_name=validated_data['lastName'],
            password=validated_data['password']
        )
        token, _ = Token.objects.get_or_create(user=user)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        email = (attrs.get('email') or '').strip().lower()
        password = attrs.get('password') or ''

        if not email or not password:
            raise serializers.ValidationError({"credentials": "Email and password are required."})

        # Find user by email or username
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            user = User.objects.filter(username__iexact=email).first()

        # Auto-provision standard demo user if logging in with default demo credentials
        if not user and email in ['tanay@example.com', 'demo@example.com'] and password == 'password123':
            user = User.objects.create_user(
                username=email,
                email=email,
                first_name='Tanay' if 'tanay' in email else 'Demo',
                last_name='Pratap' if 'tanay' in email else 'User',
                password='password123'
            )
            Token.objects.get_or_create(user=user)

        if not user or not user.check_password(password):
            raise serializers.ValidationError({"credentials": "Invalid email or password."})

        attrs['user'] = user
        return attrs


class LabelSerializer(serializers.ModelSerializer):
    habit_count = serializers.SerializerMethodField()

    class Meta:
        model = Label
        fields = ['id', 'name', 'color', 'habit_count']

    def get_habit_count(self, obj):
        return obj.habits.filter(status='ACTIVE').count()


class CompletionSerializer(serializers.ModelSerializer):
    habitId = serializers.IntegerField(source='habit.id', read_only=True)

    class Meta:
        model = Completion
        fields = ['id', 'habitId', 'date', 'count', 'created_at']


class HabitSerializer(serializers.ModelSerializer):
    startDate = serializers.DateField(source='start_date')
    endDate = serializers.DateField(source='end_date', required=False, allow_null=True)
    reminderTime = serializers.CharField(source='reminder_time', required=False, allow_null=True, allow_blank=True)
    labels = serializers.SerializerMethodField()
    labelNames = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)
    todayCompletions = serializers.SerializerMethodField()

    class Meta:
        model = Habit
        fields = [
            'id', 
            'name', 
            'description', 
            'startDate', 
            'endDate', 
            'goal', 
            'frequency', 
            'color', 
            'category',
            'reminderTime',
            'status', 
            'labels', 
            'labelNames',
            'todayCompletions',
            'created_at', 
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_labels(self, obj):
        return [l.name for l in obj.labels.all()]

    def validate_goal(self, value):
        if value < 1:
            raise serializers.ValidationError("Goal must be at least 1.")
        return value

    def validate_frequency(self, value):
        val = value.upper()
        if val not in ['DAILY', 'WEEKLY', 'MONTHLY']:
            raise serializers.ValidationError("Frequency must be DAILY, WEEKLY, or MONTHLY.")
        return val

    def validate_status(self, value):
        val = value.upper()
        if val not in ['ACTIVE', 'ARCHIVED', 'TRASHED']:
            raise serializers.ValidationError("Status must be ACTIVE, ARCHIVED, or TRASHED.")
        return val

    def validate(self, attrs):
        start = attrs.get('start_date') or (self.instance.start_date if self.instance else None)
        end = attrs.get('end_date') or (self.instance.end_date if self.instance else None)
        if start and end and end < start:
            raise serializers.ValidationError({"endDate": "End date cannot be earlier than start date."})
        return attrs

    def get_todayCompletions(self, obj):
        # Read from context if date was provided, else use today
        target_date = self.context.get('selected_date')
        if not target_date:
            from datetime import date
            target_date = date.today()
        comp = obj.completions.filter(date=target_date).first()
        return comp.count if comp else 0

    def create(self, validated_data):
        label_names = validated_data.pop('labelNames', [])
        user = self.context['request'].user
        habit = Habit.objects.create(user=user, **validated_data)

        for name in label_names:
            label, _ = Label.objects.get_or_create(user=user, name=name.strip())
            habit.labels.add(label)

        return habit

    def update(self, instance, validated_data):
        label_names = validated_data.pop('labelNames', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if label_names is not None:
            user = instance.user
            instance.labels.clear()
            for name in label_names:
                label, _ = Label.objects.get_or_create(user=user, name=name.strip())
                instance.labels.add(label)

        return instance


class ChallengeSerializer(serializers.ModelSerializer):
    startDate = serializers.DateField(source='start_date', required=False, default=date.today)
    durationDays = serializers.IntegerField(source='duration_days', default=21)
    isCompleted = serializers.BooleanField(source='is_completed', default=False)

    class Meta:
        model = Challenge
        fields = ['id', 'title', 'description', 'category', 'durationDays', 'startDate', 'isCompleted', 'created_at']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        user = self.context['request'].user
        return Challenge.objects.create(user=user, **validated_data)


class PomodoroSessionSerializer(serializers.ModelSerializer):
    habitTitle = serializers.CharField(source='habit.name', read_only=True)
    durationMinutes = serializers.IntegerField(source='duration_minutes', default=25)
    completedAt = serializers.DateTimeField(source='completed_at', read_only=True)

    class Meta:
        model = PomodoroSession
        fields = ['id', 'habit', 'habitTitle', 'durationMinutes', 'completedAt']
        read_only_fields = ['id', 'completedAt']

    def create(self, validated_data):
        user = self.context['request'].user
        return PomodoroSession.objects.create(user=user, **validated_data)

