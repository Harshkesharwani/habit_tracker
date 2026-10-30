from django.db import models
from django.contrib.auth.models import User

class Habit(models.Model):
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('ARCHIVED', 'Archived'),
        ('TRASHED', 'Trashed'),
    ]

    FREQUENCY_CHOICES = [
        ('DAILY', 'Daily'),
        ('WEEKLY', 'Weekly'),
        ('MONTHLY', 'Monthly'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='habits')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    goal = models.PositiveIntegerField(default=1)
    frequency = models.CharField(max_length=50, choices=FREQUENCY_CHOICES, default='DAILY')
    color = models.CharField(max_length=50, default='blue')
    category = models.CharField(max_length=100, default='General', blank=True)
    reminder_time = models.CharField(max_length=10, blank=True, null=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='ACTIVE')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.user.username})"


class Completion(models.Model):
    habit = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name='completions')
    date = models.DateField()
    count = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('habit', 'date')
        indexes = [
            models.Index(fields=['habit', 'date']),
        ]
        ordering = ['-date']

    def __str__(self):
        return f"{self.habit.name} on {self.date} (count: {self.count})"


class Label(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='labels')
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=50, default='#0d9488')
    habits = models.ManyToManyField(Habit, blank=True, related_name='labels')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'name')
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.user.username})"


class Challenge(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='challenges')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    category = models.CharField(max_length=100, default='General')
    duration_days = models.PositiveIntegerField(default=21)
    start_date = models.DateField()
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Challenge: {self.title} ({self.user.username})"


class PomodoroSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pomodoros')
    habit = models.ForeignKey(Habit, on_delete=models.SET_NULL, null=True, blank=True, related_name='pomodoros')
    duration_minutes = models.PositiveIntegerField(default=25)
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-completed_at']

    def __str__(self):
        return f"Pomodoro: {self.duration_minutes}m ({self.user.username})"

