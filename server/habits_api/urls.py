from django.urls import path, re_path
from . import views

urlpatterns = [
    # Auth
    re_path(r'^auth/signup/?$', views.signup_view, name='auth-signup'),
    re_path(r'^auth/login/?$', views.login_view, name='auth-login'),
    re_path(r'^auth/logout/?$', views.logout_view, name='auth-logout'),
    re_path(r'^auth/me/?$', views.me_view, name='auth-me'),

    # Habits
    re_path(r'^habits/export/csv/?$', views.export_csv_view, name='habits-export-csv'),
    re_path(r'^habits/(?P<pk>\d+)/archive/?$', views.habit_archive_view, name='habit-archive'),
    re_path(r'^habits/(?P<pk>\d+)/unarchive/?$', views.habit_unarchive_view, name='habit-unarchive'),
    re_path(r'^habits/(?P<pk>\d+)/completions/(?P<date_str>[\w-]+)/?$', views.habit_completion_date_view, name='habit-completion-date'),
    re_path(r'^habits/(?P<pk>\d+)/completions/?$', views.habit_completions_list_view, name='habit-completions-list'),
    re_path(r'^habits/(?P<pk>\d+)/?$', views.habit_detail_view, name='habit-detail'),
    re_path(r'^habits/?$', views.habits_list_create_view, name='habits-list-create'),

    # Completions
    re_path(r'^completions/?$', views.all_completions_view, name='all-completions'),

    # Dashboard & Stats
    re_path(r'^dashboard/stats/?$', views.dashboard_stats_view, name='dashboard-stats'),

    # Challenges
    re_path(r'^challenges/(?P<pk>\d+)/?$', views.challenge_detail_view, name='challenge-detail'),
    re_path(r'^challenges/?$', views.challenges_list_create_view, name='challenges-list-create'),

    # Pomodoro
    re_path(r'^pomodoro/?$', views.pomodoro_list_create_view, name='pomodoro-list-create'),

    # Labels
    re_path(r'^labels/(?P<pk>\d+)/?$', views.label_delete_view, name='label-delete'),
    re_path(r'^labels/?$', views.labels_list_create_view, name='labels-list-create'),

    # Trash
    re_path(r'^trash/(?P<pk>\d+)/restore/?$', views.trash_restore_view, name='trash-restore'),
    re_path(r'^trash/(?P<pk>\d+)/?$', views.trash_delete_permanent_view, name='trash-delete-permanent'),
    re_path(r'^trash/empty/?$', views.trash_empty_view, name='trash-empty'),
    re_path(r'^trash/?$', views.trash_list_view, name='trash-list'),
]
