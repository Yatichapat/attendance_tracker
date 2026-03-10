from django.urls import path
from . import views

urlpatterns = [
    path("auth/me/", views.auth_me, name="auth_me"),
    path("profile/upsert/", views.upsert_profile, name="upsert_profile"),
    path("profile/get/", views.get_profile, name="get_profile"),
    path("attendance/clock/", views.clock_attendance, name="clock_attendance"),
    path("attendance/records/", views.list_attendance_records, name="attendance_records"),
    path("attendance/student-checkins/", views.student_checkins, name="student_checkins"),
    path("attendance/config/", views.attendance_config, name="attendance_config"),
    path("events/", views.manage_events, name="manage_events"),
]