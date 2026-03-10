import json

from django.conf import settings
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods, require_POST

from .models import AttendanceRecord, EventLocation, UserProfile
from .utils import haversine_distance_meters


def _json_body(request):
    try:
        return json.loads(request.body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None


def _current_session_type() -> str:
    hour = timezone.localtime().hour
    if hour < 11:
        return AttendanceRecord.SESSION_MORNING
    if hour < 14:
        return AttendanceRecord.SESSION_LUNCH
    if hour < 18:
        return AttendanceRecord.SESSION_AFTERNOON
    return AttendanceRecord.SESSION_EVENING


@require_GET
def auth_me(request):
    if not request.user.is_authenticated:
        return JsonResponse({"authenticated": False}, status=200)

    email = (request.user.email or "").strip().lower()
    if not email:
        return JsonResponse(
            {
                "authenticated": True,
                "email": "",
                "error": "No email found on OAuth account.",
            },
            status=200,
        )

    return JsonResponse(
        {
            "authenticated": True,
            "email": email,
        },
        status=200,
    )


@csrf_exempt
@require_POST
def upsert_profile(request):
    payload = _json_body(request)
    if payload is None:
        return JsonResponse({"error": "Invalid JSON payload."}, status=400)

    first_name = str(payload.get("first_name", "")).strip()
    last_name = str(payload.get("last_name", "")).strip()
    role = str(payload.get("role", "")).strip()
    oauth_email = ""
    if request.user.is_authenticated:
        oauth_email = (request.user.email or "").strip().lower()

    email = oauth_email or str(payload.get("email", "")).strip().lower()

    if not all([first_name, last_name, role, email]):
        return JsonResponse({"error": "first_name, last_name, role and email are required."}, status=400)

    allowed_roles = {choice[0] for choice in UserProfile.ROLE_CHOICES}
    if role not in allowed_roles:
        return JsonResponse({"error": "Invalid role."}, status=400)

    profile, _ = UserProfile.objects.update_or_create(
        email=email,
        defaults={
            "first_name": first_name,
            "last_name": last_name,
            "role": role,
        },
    )

    return JsonResponse(
        {
            "id": profile.id,
            "first_name": profile.first_name,
            "last_name": profile.last_name,
            "role": profile.role,
            "email": profile.email,
        },
        status=200,
    )


@require_GET
def get_profile(request):
    email = str(request.GET.get("email", "")).strip().lower()
    if not email:
        return JsonResponse({"error": "email query param is required."}, status=400)

    profile = UserProfile.objects.filter(email=email).first()
    if not profile:
        return JsonResponse({"profile": None}, status=200)

    return JsonResponse(
        {
            "profile": {
                "id": profile.id,
                "first_name": profile.first_name,
                "last_name": profile.last_name,
                "role": profile.role,
                "email": profile.email,
            }
        },
        status=200,
    )


@csrf_exempt
@require_http_methods(["GET", "POST"])
def manage_events(request):
    if request.method == "GET":
        events = EventLocation.objects.filter(is_active=True)
        payload = [
            {
                "id": event.id,
                "name": event.name,
                "description": event.description,
                "latitude": event.latitude,
                "longitude": event.longitude,
                "radius_meters": event.radius_meters,
            }
            for event in events
        ]
        return JsonResponse({"events": payload}, status=200)

    payload = _json_body(request)
    if payload is None:
        return JsonResponse({"error": "Invalid JSON payload."}, status=400)

    email = str(payload.get("email", "")).strip().lower()
    if not email:
        return JsonResponse({"error": "email is required."}, status=400)

    profile = UserProfile.objects.filter(email=email).first()
    if not profile or profile.role != UserProfile.ROLE_EMPLOYEE:
        return JsonResponse({"error": "Only employee can create events."}, status=403)

    name = str(payload.get("name", "")).strip()
    if not name:
        return JsonResponse({"error": "name is required."}, status=400)
    
    description = str(payload.get("description", "")).strip()

    try:
        latitude = float(payload.get("latitude"))
        longitude = float(payload.get("longitude"))
    except (TypeError, ValueError):
        return JsonResponse({"error": "Valid latitude and longitude are required."}, status=400)

    radius_meters = min(float(payload.get("radius_meters", 200)), 200.0)
    if radius_meters <= 0:
        return JsonResponse({"error": "radius_meters must be greater than 0."}, status=400)

    event = EventLocation.objects.create(
        name=name,
        description=description,
        latitude=latitude,
        longitude=longitude,
        radius_meters=radius_meters,
    )
    return JsonResponse(
        {
            "id": event.id,
            "name": event.name,
            "description": event.description,
            "latitude": event.latitude,
            "longitude": event.longitude,
            "radius_meters": event.radius_meters,
        },
        status=201,
    )


@csrf_exempt
@require_POST
def clock_attendance(request):
    payload = _json_body(request)
    if payload is None:
        return JsonResponse({"error": "Invalid JSON payload."}, status=400)

    email = str(payload.get("email", "")).strip().lower()
    action_type = str(payload.get("action_type", AttendanceRecord.ACTION_IN)).strip() or AttendanceRecord.ACTION_IN
    face_verified = bool(payload.get("face_verified", False))
    face_image_data = str(payload.get("face_image_data", "")).strip()
    scene_image_data = str(payload.get("scene_image_data", "")).strip()

    if not email:
        return JsonResponse({"error": "email is required."}, status=400)

    try:
        latitude = float(payload.get("latitude"))
        longitude = float(payload.get("longitude"))
    except (TypeError, ValueError):
        return JsonResponse({"error": "Valid latitude and longitude are required."}, status=400)

    allowed_actions = {choice[0] for choice in AttendanceRecord.ACTION_CHOICES}
    if action_type not in allowed_actions:
        return JsonResponse({"error": "Invalid action_type."}, status=400)

    try:
        profile = UserProfile.objects.get(email=email)
    except UserProfile.DoesNotExist:
        return JsonResponse({"error": "Profile not found. Complete signup first."}, status=404)

    if profile.role != UserProfile.ROLE_STUDENT:
        return JsonResponse({"error": "Only student can submit check-in records."}, status=403)

    event_location_id = payload.get("event_location_id")
    event = None
    if event_location_id is not None:
        event = EventLocation.objects.filter(id=event_location_id, is_active=True).first()
    if not event:
        return JsonResponse({"error": "Please select a valid event location."}, status=400)

    allowed_radius = min(float(event.radius_meters), 200.0)
    authorized_lat = float(event.latitude)
    authorized_lng = float(event.longitude)

    distance = haversine_distance_meters(latitude, longitude, authorized_lat, authorized_lng)
    within_geofence = distance <= allowed_radius

    if not within_geofence:
        return JsonResponse(
            {
                "error": "Outside authorized area.",
                "distance_meters": round(distance, 2),
                "allowed_radius_meters": allowed_radius,
            },
            status=400,
        )

    if not face_verified:
        return JsonResponse({"error": "Face verification is required."}, status=400)

    if not face_image_data:
        return JsonResponse({"error": "Face image is required."}, status=400)

    session_type = _current_session_type()

    record, created = AttendanceRecord.objects.get_or_create(
        profile=profile,
        session_type=session_type,
        action_type=action_type,
        session_date=timezone.localdate(),
        defaults={
            "event_location": event,
            "latitude": latitude,
            "longitude": longitude,
            "distance_meters": distance,
            "within_geofence": within_geofence,
            "face_verified": face_verified,
            "face_image_data": face_image_data,
            "scene_image_data": scene_image_data,
        },
    )

    if not created:
        return JsonResponse(
            {
                "error": "Attendance already recorded for this session and action today.",
            },
            status=409,
        )

    return JsonResponse(
        {
            "id": record.id,
            "email": profile.email,
            "session_type": record.session_type,
            "action_type": record.action_type,
            "event": event.name,
            "distance_meters": round(record.distance_meters, 2),
            "created_at": record.created_at.isoformat(),
        },
        status=201,
    )


@require_GET
def list_attendance_records(request):
    email = str(request.GET.get("email", "")).strip().lower()
    if not email:
        return JsonResponse({"error": "email query param is required."}, status=400)

    records = AttendanceRecord.objects.filter(profile__email=email)
    payload = [
        {
            "id": item.id,
            "session_date": item.session_date.isoformat(),
            "session_type": item.session_type,
            "action_type": item.action_type,
            "event": item.event_location.name if item.event_location else "",
            "latitude": item.latitude,
            "longitude": item.longitude,
            "distance_meters": round(item.distance_meters, 2),
            "face_verified": item.face_verified,
            "created_at": item.created_at.isoformat(),
        }
        for item in records
    ]
    return JsonResponse({"records": payload}, status=200)


@require_GET
def attendance_config(request):
    allowed_radius = min(float(getattr(settings, "ATTENDANCE_RADIUS_METERS", 200)), 200.0)
    return JsonResponse(
        {
            "authorized_lat": float(getattr(settings, "AUTHORIZED_LOCATION_LAT", 13.7563)),
            "authorized_lng": float(getattr(settings, "AUTHORIZED_LOCATION_LNG", 100.5018)),
            "allowed_radius_meters": allowed_radius,
        },
        status=200,
    )


@require_GET
def student_checkins(request):
    email = str(request.GET.get("email", "")).strip().lower()
    if not email:
        return JsonResponse({"error": "email query param is required."}, status=400)

    profile = UserProfile.objects.filter(email=email).first()
    if not profile or profile.role != UserProfile.ROLE_EMPLOYEE:
        return JsonResponse({"error": "Only employee can view student check-ins."}, status=403)

    today = timezone.localdate()
    records = AttendanceRecord.objects.filter(
        session_date=today,
        profile__role=UserProfile.ROLE_STUDENT,
    ).select_related("profile", "event_location")

    payload = [
        {
            "id": item.id,
            "student_name": f"{item.profile.first_name} {item.profile.last_name}",
            "student_email": item.profile.email,
            "session_type": item.session_type,
            "action_type": item.action_type,
            "event": item.event_location.name if item.event_location else "",
            "distance_meters": round(item.distance_meters, 2),
            "created_at": item.created_at.isoformat(),
        }
        for item in records
    ]
    return JsonResponse({"records": payload}, status=200)