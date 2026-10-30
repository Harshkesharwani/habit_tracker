from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('auth/signup', views.signup_view, name='auth-signup'),
    path('auth/login', views.login_view, name='auth-login'),
    path('auth/logout', views.logout_view, name='auth-logout'),
    path('auth/me', views.me_view, name='auth-me'),

    # Habits
    path('habits', views.habits_list_create_view, name='habits-list-create'),
    path('habits/export/csv', views.export_csv_view, name='habits-export-csv'),
    path('habits/<int:pk>', views.habit_detail_view, name='habit-detail'),
    path('habits/<int:pk>/archive', views.habit_archive_view, name='habit-archive'),
    path('habits/<int:pk>/unarchive', views.habit_unarchive_view, name='habit-unarchive'),

    # Completions
    path('habits/<int:pk>/completions', views.habit_completions_list_view, name='habit-completions-list'),
    path('habits/<int:pk>/completions/<str:date_str>', views.habit_completion_date_view, name='habit-completion-date'),
    path('completions', views.all_completions_view, name='all-completions'),

    # Dashboard & Stats
    path('dashboard/stats', views.dashboard_stats_view, name='dashboard-stats'),

    # Challenges
    path('challenges', views.challenges_list_create_view, name='challenges-list-create'),
    path('challenges/<int:pk>', views.challenge_detail_view, name='challenge-detail'),

    # Pomodoro
    path('pomodoro', views.pomodoro_list_create_view, name='pomodoro-list-create'),

    # Labels
    path('labels', views.labels_list_create_view, name='labels-list-create'),
    path('labels/<int:pk>', views.label_delete_view, name='label-delete'),

    # Trash
    path('trash', views.trash_list_view, name='trash-list'),
    path('trash/<int:pk>/restore', views.trash_restore_view, name='trash-restore'),
    path('trash/<int:pk>', views.trash_delete_permanent_view, name='trash-delete-permanent'),
    path('trash/empty', views.trash_empty_view, name='trash-empty'),
]
