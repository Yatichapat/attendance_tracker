"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";

type SignupProfile = {
  firstName: string;
  lastName: string;
  role: "student" | "employee";
  email: string;
};

type AttendanceRecord = {
  id: number;
  session_date: string;
  session_type: string;
  action_type: string;
  event: string;
  distance_meters: number;
  created_at: string;
};

type EventLocation = {
  id: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
};

type StudentCheckin = {
  id: number;
  student_name: string;
  student_email: string;
  session_type: string;
  event: string;
  distance_meters: number;
  created_at: string;
};

const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000";

export default function ScanPage() {
  const [profile, setProfile] = useState<SignupProfile | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [actionType, setActionType] = useState("in");
  const [faceVerified, setFaceVerified] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [events, setEvents] = useState<EventLocation[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [studentCheckins, setStudentCheckins] = useState<StudentCheckin[]>([]);
  const [faceImageData, setFaceImageData] = useState("");
  const [sceneImageData, setSceneImageData] = useState("");
  const [newEventName, setNewEventName] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const geolocationReady = useMemo(
    () => latitude !== null && longitude !== null,
    [latitude, longitude]
  );

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("attendance_logged_in") === "true";
    if (!isLoggedIn) {
      window.location.replace("/");
      return;
    }

    const raw = localStorage.getItem("signup_profile");
    const parsed = raw ? (JSON.parse(raw) as SignupProfile) : null;
    setProfile(parsed);

    if (!parsed?.email) {
      window.location.replace("/login");
      return;
    }

    void fetchEvents();
    void fetchRecords(parsed.email);

    if (parsed.role === "employee") {
      void fetchStudentCheckins(parsed.email);
    }
  }, []);

  const fetchEvents = async () => {
    const response = await fetch(`${backendBase}/api/events/`);
    if (!response.ok) {
      return;
    }
    const payload = await response.json();
    const availableEvents = (payload.events ?? []) as EventLocation[];
    setEvents(availableEvents);
    if (availableEvents.length > 0) {
      setSelectedEventId(String(availableEvents[0].id));
    }
  };

  const fetchRecords = async (email: string) => {
    const response = await fetch(
      `${backendBase}/api/attendance/records/?email=${encodeURIComponent(email)}`
    );
    if (!response.ok) {
      return;
    }
    const payload = await response.json();
    setRecords(payload.records ?? []);
  };

  const fetchStudentCheckins = async (email: string) => {
    const response = await fetch(
      `${backendBase}/api/attendance/student-checkins/?email=${encodeURIComponent(email)}`
    );
    if (!response.ok) {
      return;
    }
    const payload = await response.json();
    setStudentCheckins(payload.records ?? []);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read file."));
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (
    event: ChangeEvent<HTMLInputElement>,
    setData: (value: string) => void
  ) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }
    try {
      const encoded = await fileToBase64(selectedFile);
      setData(encoded);
    } catch {
      setError("Could not read image file.");
    }
  };

  const readCurrentLocation = () => {
    setError("");
    setMessage("");
    if (!navigator.geolocation) {
      setError("Geolocation is not supported on this device.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setMessage("Location captured.");
      },
      () => {
        setError("Could not read your location. Please allow location access.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submitAttendance = async () => {
    setError("");
    setMessage("");

    if (!profile?.email) {
      setError("Profile not found. Please login again.");
      return;
    }

    if (!geolocationReady) {
      setError("Please capture your location first.");
      return;
    }

    if (!selectedEventId) {
      setError("Please select event location.");
      return;
    }

    if (!faceVerified) {
      setError("Please complete face verification option before submitting.");
      return;
    }

    if (!faceImageData) {
      setError("Please capture/upload face image.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${backendBase}/api/attendance/clock/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: profile.email,
          action_type: actionType,
          event_location_id: Number(selectedEventId),
          latitude,
          longitude,
          face_verified: faceVerified,
          face_image_data: faceImageData,
          scene_image_data: sceneImageData,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to save attendance.");
      }

      setMessage(
        `Attendance saved. Session: ${String(payload.session_type ?? "-")}, Distance: ${String(
          payload.distance_meters ?? "-"
        )}m`
      );
      await fetchRecords(profile.email);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async () => {
    setError("");
    setMessage("");
    if (!profile?.email) {
      return;
    }

    if (!newEventName || !newEventDescription) {
      setError("Please complete event name and description.");
      return;
    }

    if (!geolocationReady) {
      setError("Please capture location first.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${backendBase}/api/events/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: profile.email,
          name: newEventName,
          description: newEventDescription,
          latitude: latitude,
          longitude: longitude,
          radius_meters: 200,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not create event.");
      }

      setMessage("Event created.");
      setNewEventName("");
      setNewEventDescription("");
      await fetchEvents();
      await fetchStudentCheckins(profile.email);
    } catch (eventError) {
      setError(eventError instanceof Error ? eventError.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-100 p-6">
        <p className="text-sm text-zinc-600">Loading...</p>
      </main>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-zinc-100 p-6 pt-24 md:p-10 md:pt-28">
        <section className="mx-auto w-full max-w-4xl rounded-xl bg-white p-6 shadow-lg md:p-8">
          <h1 className="text-2xl font-bold text-zinc-900">Attendance Scan</h1>
          <p className="mt-2 text-sm text-zinc-600">
            {profile.role === "student"
              ? "Student: choose event, capture location, upload face/scene images and check in."
              : "Employee: monitor student check-ins and manage event locations."}
          </p>

          {profile.role === "student" ? (
            <>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Event Location</label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2"
                  >
                    <option value="">Select event location</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.name} ({event.radius_meters}m)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Action</label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2"
                  >
                    <option value="in">Check In</option>
                    <option value="out">Check Out</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Face image</label>
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={(event) => {
                      void handleImageChange(event, setFaceImageData);
                    }}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Scene image</label>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(event) => {
                      void handleImageChange(event, setSceneImageData);
                    }}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                <label className="flex items-center gap-2 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    checked={faceVerified}
                    onChange={(e) => setFaceVerified(e.target.checked)}
                  />
                  Face recognized
                </label>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={readCurrentLocation}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Capture Location
                </button>
                <button
                  onClick={submitAttendance}
                  disabled={loading}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {loading ? "Saving..." : "Check In"}
                </button>
              </div>

              <div className="mt-3 text-sm text-zinc-600">
                {latitude !== null && longitude !== null ? (
                  <p>
                    Current location: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                  </p>
                ) : (
                  <p>Location not captured yet.</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="mt-6 rounded-xl border border-zinc-200 p-4">
                <h2 className="text-lg font-semibold text-zinc-900">Create Event Location</h2>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <input
                    value={newEventName}
                    onChange={(e) => setNewEventName(e.target.value)}
                    placeholder="Event name"
                    className="rounded-lg border border-zinc-300 px-3 py-2"
                  />
                  <input
                    value={newEventDescription}
                    onChange={(e) => setNewEventDescription(e.target.value)}
                    placeholder="Description"
                    className="rounded-lg border border-zinc-300 px-3 py-2"
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    onClick={readCurrentLocation}
                    className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                  >
                    Capture Location
                  </button>
                  <button
                    onClick={createEvent}
                    disabled={loading || !geolocationReady}
                    className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
                  >
                    Save Event
                  </button>
                </div>
                <div className="mt-2 text-sm text-zinc-600">
                  {latitude !== null && longitude !== null ? (
                    <p>
                      Captured: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                    </p>
                  ) : (
                    <p>Location not captured yet.</p>
                  )}
                </div>
              </div>
            </>
          )}

          {message ? <p className="mt-2 text-sm text-emerald-600">{message}</p> : null}
          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        </section>

        <section className="mx-auto mt-6 w-full max-w-4xl rounded-xl bg-white p-6 shadow-lg md:p-8">
          <h2 className="text-lg font-semibold text-zinc-900">
            {profile.role === "student" ? "Attendance History" : "Students Checked In Today"}
          </h2>
          {profile.role === "student" && records.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-600">No records yet.</p>
          ) : null}
          {profile.role === "employee" && studentCheckins.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-600">No student check-ins yet.</p>
          ) : null}
          {profile.role === "student" && records.length > 0 ? (
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-left text-zinc-600">
                    <th className="px-2 py-2">Date</th>
                    <th className="px-2 py-2">Session</th>
                    <th className="px-2 py-2">Event</th>
                    <th className="px-2 py-2">Distance (m)</th>
                    <th className="px-2 py-2">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} className="border-b border-zinc-100 text-zinc-700">
                      <td className="px-2 py-2">{record.session_date}</td>
                      <td className="px-2 py-2">{record.session_type}</td>
                      <td className="px-2 py-2">{record.event}</td>
                      <td className="px-2 py-2">{record.distance_meters}</td>
                      <td className="px-2 py-2">{new Date(record.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {profile.role === "employee" && studentCheckins.length > 0 ? (
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-left text-zinc-600">
                    <th className="px-2 py-2">Student</th>
                    <th className="px-2 py-2">Email</th>
                    <th className="px-2 py-2">Session</th>
                    <th className="px-2 py-2">Event</th>
                    <th className="px-2 py-2">Distance (m)</th>
                    <th className="px-2 py-2">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {studentCheckins.map((record) => (
                    <tr key={record.id} className="border-b border-zinc-100 text-zinc-700">
                      <td className="px-2 py-2">{record.student_name}</td>
                      <td className="px-2 py-2">{record.student_email}</td>
                      <td className="px-2 py-2">{record.session_type}</td>
                      <td className="px-2 py-2">{record.event}</td>
                      <td className="px-2 py-2">{record.distance_meters}</td>
                      <td className="px-2 py-2">{new Date(record.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </main>
    </>
  );
}
