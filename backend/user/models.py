from django.db import models


class UserProfile(models.Model):
	ROLE_STUDENT = "student"
	ROLE_EMPLOYEE = "employee"

	ROLE_CHOICES = [
		(ROLE_STUDENT, "Student"),
		(ROLE_EMPLOYEE, "Employee"),
	]

	first_name = models.CharField(max_length=100)
	last_name = models.CharField(max_length=100)
	role = models.CharField(max_length=20, choices=ROLE_CHOICES)
	email = models.EmailField(unique=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	def __str__(self):
		return f"{self.first_name} {self.last_name} ({self.email})"


class EventLocation(models.Model):
	name = models.CharField(max_length=120)
	description = models.TextField(blank=True, default="")
	latitude = models.FloatField()
	longitude = models.FloatField()
	radius_meters = models.FloatField(default=200)
	is_active = models.BooleanField(default=True)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["name"]

	def __str__(self):
		return f"{self.name} ({self.radius_meters}m)"


class AttendanceRecord(models.Model):
	SESSION_MORNING = "morning"
	SESSION_LUNCH = "lunch"
	SESSION_AFTERNOON = "afternoon"
	SESSION_EVENING = "evening"

	SESSION_CHOICES = [
		(SESSION_MORNING, "Morning"),
		(SESSION_LUNCH, "Lunch"),
		(SESSION_AFTERNOON, "Afternoon"),
		(SESSION_EVENING, "Evening"),
	]

	ACTION_IN = "in"
	ACTION_OUT = "out"
	ACTION_CHOICES = [
		(ACTION_IN, "Clock In"),
		(ACTION_OUT, "Clock Out"),
	]

	profile = models.ForeignKey(
		UserProfile, on_delete=models.CASCADE, related_name="attendance_records"
	)
	event_location = models.ForeignKey(
		EventLocation,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="attendance_records",
	)
	session_date = models.DateField(auto_now_add=True)
	session_type = models.CharField(max_length=20, choices=SESSION_CHOICES)
	action_type = models.CharField(max_length=10, choices=ACTION_CHOICES)
	latitude = models.FloatField()
	longitude = models.FloatField()
	distance_meters = models.FloatField()
	within_geofence = models.BooleanField(default=False)
	face_verified = models.BooleanField(default=False)
	face_image_data = models.TextField(blank=True, default="")
	scene_image_data = models.TextField(blank=True, default="")
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		constraints = [
			models.UniqueConstraint(
				fields=["profile", "session_date", "session_type", "action_type"],
				name="unique_profile_daily_session_action",
			)
		]
		ordering = ["-created_at"]

	def __str__(self):
		return (
			f"{self.profile.email} {self.session_date} "
			f"{self.session_type} {self.action_type}"
		)
