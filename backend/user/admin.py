from django.contrib import admin
from .models import AttendanceRecord, EventLocation, UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
	list_display = ("first_name", "last_name", "role", "email", "updated_at")
	search_fields = ("first_name", "last_name", "email")
	list_filter = ("role",)


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
	list_display = (
		"profile",
		"event_location",
		"session_date",
		"session_type",
		"action_type",
		"distance_meters",
		"within_geofence",
		"face_verified",
		"created_at",
	)
	list_filter = ("session_type", "action_type", "within_geofence", "face_verified")
	search_fields = ("profile__email", "profile__first_name", "profile__last_name")


@admin.register(EventLocation)
class EventLocationAdmin(admin.ModelAdmin):
	list_display = ("name", "latitude", "longitude", "radius_meters", "is_active")
	list_filter = ("is_active",)
	search_fields = ("name",)
