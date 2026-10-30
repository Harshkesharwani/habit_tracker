import json
from pathlib import Path
from datetime import datetime, date
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from habits_api.models import Habit, Completion, Label

class Command(BaseCommand):
    help = 'Load sample habits and completions from mock-data/habits.json'

    def handle(self, *args, **options):
        # Create or get default demo user
        user, created = User.objects.get_or_create(
            username='tanay@example.com',
            defaults={
                'email': 'tanay@example.com',
                'first_name': 'Tanay',
                'last_name': 'Pratap',
            }
        )
        if created:
            user.set_password('password123')
            user.save()
            Token.objects.get_or_create(user=user)
            self.stdout.write(self.style.SUCCESS('Created default demo user: tanay@example.com / password123'))
        else:
            Token.objects.get_or_create(user=user)

        # Labels
        lbl_health, _ = Label.objects.get_or_create(user=user, name='Health & Fitness')
        lbl_prod, _ = Label.objects.get_or_create(user=user, name='Productivity')
        lbl_one, _ = Label.objects.get_or_create(user=user, name='Label 1')
        lbl_two, _ = Label.objects.get_or_create(user=user, name='Label 2')

        # Find mock-data/habits.json
        base_dir = Path(__file__).resolve().parent.parent.parent.parent.parent
        mock_file = base_dir / 'mock-data' / 'habits.json'

        if mock_file.exists():
            with open(mock_file, 'r', encoding='utf-8') as f:
                data = json.load(f)

            habit_map = {}
            for h in data.get('habits', []):
                habit, h_created = Habit.objects.get_or_create(
                    user=user,
                    name=h.get('name'),
                    defaults={
                        'description': h.get('description', ''),
                        'start_date': datetime.strptime(h.get('startDate'), '%Y-%m-%d').date(),
                        'frequency': h.get('frequency', 'DAILY'),
                        'status': h.get('status', 'ACTIVE'),
                        'goal': 2,
                        'color': 'blue' if 'Read' in h.get('name') else 'pink',
                    }
                )
                habit.labels.add(lbl_one, lbl_prod)
                habit_map[h.get('id')] = habit
                if h_created:
                    self.stdout.write(f"Loaded habit: {habit.name}")

            for c in data.get('completions', []):
                h_ref = habit_map.get(c.get('habitId'))
                if h_ref:
                    comp_date = datetime.strptime(c.get('date'), '%Y-%m-%d').date()
                    comp, c_created = Completion.objects.get_or_create(
                        habit=h_ref,
                        date=comp_date,
                        defaults={'count': 2}
                    )
                    if c_created:
                        self.stdout.write(f"Loaded completion for {h_ref.name} on {comp_date}")

        # Also add a couple more habits to match PDF screens (Tasks #1, #2, #3, #4, #12)
        demo_habits = [
            ("Task #3 - Deep Work Focus", "Work without phone notifications", 2, "yellow", date.today(), [lbl_one, lbl_prod]),
            ("Task #4 - Drink 3L Water", "Stay hydrated throughout the day", 2, "green", date.today(), [lbl_health]),
            ("Task #12 - Mindfulness & Meditation", "10 minutes guided breathing", 2, "pink", date.today(), [lbl_one, lbl_two]),
        ]

        for name, desc, goal, color, s_date, labels in demo_habits:
            h, created = Habit.objects.get_or_create(
                user=user,
                name=name,
                defaults={
                    'description': desc,
                    'goal': goal,
                    'color': color,
                    'start_date': s_date,
                    'frequency': 'DAILY',
                    'status': 'ACTIVE',
                }
            )
            for l in labels:
                h.labels.add(l)

        # Mark Task #12 completed today
        h12 = Habit.objects.filter(user=user, name__startswith="Task #12").first()
        if h12:
            Completion.objects.get_or_create(habit=h12, date=date.today(), defaults={'count': 2})

        self.stdout.write(self.style.SUCCESS('Successfully loaded all mock data into Django!'))
