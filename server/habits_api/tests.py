from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date, timedelta

from .models import Habit, Completion, Label

class HabitTrackerBackendTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_a = User.objects.create_user(
            username='usera@example.com',
            email='usera@example.com',
            first_name='Asha',
            last_name='Sharma',
            password='password123'
        )
        self.user_b = User.objects.create_user(
            username='userb@example.com',
            email='userb@example.com',
            first_name='Bob',
            last_name='Builder',
            password='password123'
        )

    def test_signup_and_validation(self):
        # Successful signup
        res = self.client.post('/api/auth/signup', {
            'firstName': 'Charlie',
            'lastName': 'Brown',
            'email': 'charlie@example.com',
            'password': 'securepassword'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', res.data)
        self.assertEqual(res.data['user']['email'], 'charlie@example.com')

        # Duplicate email should fail with validation error
        res_dup = self.client.post('/api/auth/signup', {
            'firstName': 'Duplicate',
            'lastName': 'User',
            'email': 'charlie@example.com',
            'password': 'securepassword'
        }, format='json')
        self.assertEqual(res_dup.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res_dup.data['error']['code'], 'VALIDATION_ERROR')

    def test_login_flow(self):
        # Invalid password
        res_fail = self.client.post('/api/auth/login', {
            'email': 'usera@example.com',
            'password': 'wrongpassword'
        }, format='json')
        self.assertEqual(res_fail.status_code, status.HTTP_400_BAD_REQUEST)

        # Valid login
        res = self.client.post('/api/auth/login', {
            'email': 'usera@example.com',
            'password': 'password123'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('token', res.data)

    def test_habit_crud_and_ownership_isolation(self):
        # Authenticate as User A
        self.client.force_authenticate(user=self.user_a)

        # Create Habit
        res = self.client.post('/api/habits', {
            'name': 'Morning Exercise',
            'description': '30 mins workout',
            'startDate': '2026-10-01',
            'goal': 2,
            'frequency': 'DAILY',
            'color': 'blue',
            'labelNames': ['Fitness', 'Health']
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        habit_id = res.data['id']
        self.assertEqual(res.data['name'], 'Morning Exercise')
        self.assertEqual(set(res.data['labels']), {'Fitness', 'Health'})

        # Authenticate as User B (Should NOT see User A's habit)
        self.client.force_authenticate(user=self.user_b)
        res_b_list = self.client.get('/api/habits')
        self.assertEqual(len(res_b_list.data), 0)

        # User B trying to access User A's habit directly gets 404
        res_b_detail = self.client.get(f'/api/habits/{habit_id}')
        self.assertEqual(res_b_detail.status_code, status.HTTP_404_NOT_FOUND)

        # Switch back to User A
        self.client.force_authenticate(user=self.user_a)
        res_patch = self.client.patch(f'/api/habits/{habit_id}', {
            'name': 'Morning Jog & Exercise'
        }, format='json')
        self.assertEqual(res_patch.status_code, status.HTTP_200_OK)
        self.assertEqual(res_patch.data['name'], 'Morning Jog & Exercise')

    def test_archive_excludes_from_active_list(self):
        self.client.force_authenticate(user=self.user_a)
        habit = Habit.objects.create(
            user=self.user_a,
            name='Temporary Habit',
            start_date=date.today(),
            goal=1
        )

        # Archive habit
        res_archive = self.client.post(f'/api/habits/{habit.id}/archive')
        self.assertEqual(res_archive.status_code, status.HTTP_200_OK)

        # Active list should NOT include archived habit
        res_active = self.client.get('/api/habits?status=active')
        self.assertEqual(len(res_active.data), 0)

        # Archived list should include it
        res_archived = self.client.get('/api/habits?status=archived')
        self.assertEqual(len(res_archived.data), 1)

    def test_prevent_duplicate_completions_at_data_layer(self):
        self.client.force_authenticate(user=self.user_a)
        habit = Habit.objects.create(
            user=self.user_a,
            name='Daily Reading',
            start_date=date.today(),
            goal=2
        )
        today_str = date.today().strftime('%Y-%m-%d')

        # First completion
        res1 = self.client.put(f'/api/habits/{habit.id}/completions/{today_str}', {
            'count': 1
        }, format='json')
        self.assertEqual(res1.status_code, status.HTTP_200_OK)

        # Second completion update for same date (idempotent / upsert)
        res2 = self.client.put(f'/api/habits/{habit.id}/completions/{today_str}', {
            'count': 2
        }, format='json')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)

        # Verify database record count for (habit, date) is strictly 1
        comp_count = Completion.objects.filter(habit=habit, date=date.today()).count()
        self.assertEqual(comp_count, 1)

        # Verify undo completion
        res_del = self.client.delete(f'/api/habits/{habit.id}/completions/{today_str}')
        self.assertEqual(res_del.status_code, status.HTTP_200_OK)
        self.assertEqual(Completion.objects.filter(habit=habit, date=date.today()).count(), 0)

    def test_dynamic_dashboard_statistics(self):
        self.client.force_authenticate(user=self.user_a)
        today = date.today()
        yesterday = today - timedelta(days=1)

        h1 = Habit.objects.create(user=self.user_a, name='H1', start_date=yesterday, goal=2, status='ACTIVE')
        h2 = Habit.objects.create(user=self.user_a, name='H2', start_date=yesterday, goal=2, status='ACTIVE')

        # Complete h1 today
        Completion.objects.create(habit=h1, date=today, count=2)
        # Partial h2 today
        Completion.objects.create(habit=h2, date=today, count=1)

        res = self.client.get(f'/api/dashboard/stats?date={today.strftime("%Y-%m-%d")}')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['total'], 2)
        self.assertEqual(res.data['completedToday'], 1)
        self.assertEqual(res.data['inProgress'], 1)
        self.assertEqual(res.data['habitScore'], 50)  # 1 out of 2 completed = 50%
        self.assertIn('streak', res.data)
