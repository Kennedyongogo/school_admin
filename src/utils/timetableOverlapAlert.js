import Swal from "sweetalert2";

/** Exact API message from curriculumClassTimetableController assertNoTeacherOverlap */
export const TIMETABLE_TEACHER_OVERLAP_MESSAGE =
  "This teacher already has a lesson that overlaps this time on that date (including other curricula).";

/**
 * If the API message is the teacher schedule overlap conflict, show SweetAlert and return true.
 */
export function showTeacherOverlapSweetAlert(apiMessage) {
  const msg = apiMessage != null ? String(apiMessage).trim() : "";
  if (
    msg !== TIMETABLE_TEACHER_OVERLAP_MESSAGE &&
    !msg.includes("already has a lesson that overlaps this time on that date")
  ) {
    return false;
  }
  void Swal.fire({
    icon: "warning",
    title: "Schedule conflict",
    text: TIMETABLE_TEACHER_OVERLAP_MESSAGE,
    confirmButtonColor: "#DC2626",
  });
  return true;
}
