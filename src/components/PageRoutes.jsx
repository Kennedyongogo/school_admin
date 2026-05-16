import React, { useEffect, useState } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { Box } from "@mui/material";
import BrandPageLoader from "./Util/BrandPageLoader";
import Navbar from "./Navbar";
import Settings from "../Pages/Settings";
import NotFound from "../Pages/NotFound";
import Blogs from "./Blogs/Blogs";
import BlogCreate from "./Blogs/BlogCreate";
import BlogView from "./Blogs/BlogView";
import BlogEdit from "./Blogs/BlogEdit";
import Form from "./Form/Form";
import FormCreate from "./Form/FormCreate";
import FormView from "./Form/FormView";
import FormEdit from "./Form/FormEdit";
import FormSubmission from "./Form/FormSubmissions";
import Review from "./Review/Review";
import CharityMap from "../CharityMap";
import Documents from "./Documents/Documents";
import UsersTable from "./Users/UsersTable";
import UsersCreate from "./Users/UsersCreate";
import CurriculumTable from "./Curriculum/CurriculumTable";
import CurriculumCreate from "./Curriculum/CurriculumCreate";
import CurriculumFeeStructureCreate from "./Curriculum/CurriculumFeeStructureCreate";
import ElimuPlusSchoolProfile from "./SchoolProfile/ElimuPlusSchoolProfile";
import ElimuPlusSchoolProfileForm from "./SchoolProfile/ElimuPlusSchoolProfileForm";
import ElimuPlusStudentCreate from "./SchoolProfile/ElimuPlusStudentCreate";
import ElimuPlusStudentEdit from "./SchoolProfile/ElimuPlusStudentEdit";
import ElimuPlusTeacherCreate from "./SchoolProfile/ElimuPlusTeacherCreate";
import ElimuPlusSchoolAdminCreate from "./SchoolProfile/ElimuPlusSchoolAdminCreate";
import ElimuPlusSchoolAdminDetail from "./SchoolProfile/ElimuPlusSchoolAdminDetail";
import ElimuPlusTeacherDetail from "./SchoolProfile/ElimuPlusTeacherDetail";
import Analytics from "./Analytics/Analytics";
import Audit from "./Audit/Audit";
import Projects from "./Projects/Projects";
import ProjectView from "./Projects/ProjectView";
import ProjectCreate from "./Projects/ProjectCreate";
import ProjectEdit from "./Projects/ProjectEdit";
import Services from "./Services/Services";
import ServiceView from "./Services/ServiceView";
import ServiceCreate from "./Services/ServiceCreate";
import ServiceEdit from "./Services/ServiceEdit";
import FAQs from "./FAQs/FAQs";
import FAQCreate from "./FAQs/FAQCreate";
import FAQEdit from "./FAQs/FAQEdit";
import FAQView from "./FAQs/FAQView";
import ContactView from "./Contacts/ContactView";
import QuoteView from "./Quotations/QuoteView";
import ConsultationView from "./Consultations/ConsultationView";
import Submissions from "./Submissions/Submissions";
import Marketplace from "../Pages/Marketplace";
import Timetable from "../Pages/Timetable";
import TimetableDayPage from "../Pages/TimetableDayPage";
import TimetableCreatePage from "../Pages/TimetableCreatePage";
import TimetableManagePage from "../Pages/TimetableManagePage";
import ElimuPlusOnlineHub from "../Pages/ElimuPlusOnlineHub";
import OnlineScheduledLessonsPage from "../Pages/OnlineScheduledLessonsPage";
import OnlineScheduledExamsPage from "../Pages/OnlineScheduledExamsPage";
import LiveClassRoomPage from "../Pages/LiveClassRoomPage";
import EventLiveRoomPage from "../Pages/EventLiveRoomPage";
import ExamManagementPage from "../Pages/ExamManagementPage";
import ExamSubmissionsPage from "../Pages/ExamSubmissionsPage";
import AccountingDashboardPage from "../Pages/AccountingDashboardPage";
import HRPage from "../Pages/HRPage";
import TrainingEventCreate from "./TrainingOpportunities/TrainingEvents/TrainingEventCreate";
import TrainingEventEdit from "./TrainingOpportunities/TrainingEvents/TrainingEventEdit";
import TrainingEventView from "./TrainingOpportunities/TrainingEvents/TrainingEventView";
import GrantCreate from "./TrainingOpportunities/Grants/GrantCreate";
import GrantEdit from "./TrainingOpportunities/Grants/GrantEdit";
import GrantView from "./TrainingOpportunities/Grants/GrantView";
import PartnerCreate from "./TrainingOpportunities/Partners/PartnerCreate";
import PartnerEdit from "./TrainingOpportunities/Partners/PartnerEdit";
import PartnerView from "./TrainingOpportunities/Partners/PartnerView";
import JobOpportunityCreate from "./TrainingOpportunities/JobOpportunities/JobOpportunityCreate";
import JobOpportunityEdit from "./TrainingOpportunities/JobOpportunities/JobOpportunityEdit";
import JobOpportunityView from "./TrainingOpportunities/JobOpportunities/JobOpportunityView";

function PageRoutes() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user from localStorage on component mount
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
      setLoading(false);
    } else {
      // Redirect to login if no user or token
      window.location.href = "/";
    }
  }, []);

  useEffect(() => {
    if (user) {
      setLoading(false);
    }
  }, [user]);

  return (
    <Box sx={{ display: "flex" }}>
      <Navbar user={user} setUser={setUser} />
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 9 }}>
        {loading ? (
          <BrandPageLoader />
        ) : (
          <Routes>
            <Route path="home" element={<Navigate to="/analytics" replace />} />
            <Route path="dashboard" element={<Navigate to="/analytics" replace />} />
            <Route path="hr" element={<HRPage />} />
            <Route path="accounting" element={<AccountingDashboardPage />} />
            <Route path="accounting/fee-structures/create" element={<CurriculumFeeStructureCreate />} />
            <Route path="exam" element={<ExamManagementPage />} />
            <Route path="exam/:examId/submissions" element={<ExamSubmissionsPage />} />
            <Route path="blogs" element={<Blogs />} />
            <Route path="blogs/create" element={<BlogCreate />} />
            <Route path="blogs/:id" element={<BlogView />} />
            <Route path="blogs/:id/edit" element={<BlogEdit />} />
            <Route path="forms" element={<Form />} />
            <Route path="forms/create" element={<FormCreate />} />
            <Route path="forms/:id" element={<FormView />} />
            <Route path="forms/:id/edit" element={<FormEdit />} />
            <Route
              path="forms/:form_id/submissions"
              element={<FormSubmission />}
            />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/create" element={<ProjectCreate />} />
            <Route path="projects/:id" element={<ProjectView />} />
            <Route path="projects/:id/edit" element={<ProjectEdit />} />
            <Route path="services" element={<Services />} />
            <Route path="services/create" element={<ServiceCreate />} />
            <Route path="services/:id" element={<ServiceView />} />
            <Route path="services/:id/edit" element={<ServiceEdit />} />
            <Route
              path="testimonies"
              element={<Navigate to="/reviews" replace />}
            />
            <Route path="reviews" element={<Review />} />
            <Route path="faqs" element={<FAQs />} />
            <Route path="faqs/create" element={<FAQCreate />} />
            <Route path="faqs/:id" element={<FAQView />} />
            <Route path="faqs/:id/edit" element={<FAQEdit />} />
            <Route path="submissions" element={<Submissions />} />
            <Route path="contacts/:id" element={<ContactView />} />
            <Route path="quotations/:id" element={<QuoteView />} />
            <Route path="consultations/:id" element={<ConsultationView />} />
            <Route path="map" element={<CharityMap />} />
            <Route path="documents" element={<Documents />} />
            <Route path="audit" element={<Audit />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="elimu-plus/create" element={<ElimuPlusSchoolProfileForm mode="create" />} />
            <Route path="elimu-plus/edit" element={<ElimuPlusSchoolProfileForm mode="edit" />} />
            <Route path="elimu-plus/teachers/create" element={<ElimuPlusTeacherCreate />} />
            <Route path="elimu-plus/teachers/:teacherId" element={<ElimuPlusTeacherDetail />} />
            <Route path="elimu-plus/school-admins/create" element={<ElimuPlusSchoolAdminCreate />} />
            <Route path="elimu-plus/school-admins/:id" element={<ElimuPlusSchoolAdminDetail />} />
            <Route path="elimu-plus/students/create" element={<ElimuPlusStudentCreate />} />
            <Route path="elimu-plus/students/:studentId/edit" element={<ElimuPlusStudentEdit />} />
            <Route path="elimu-plus" element={<ElimuPlusSchoolProfile />} />
            <Route path="users/create" element={<UsersCreate />} />
            <Route path="users" element={<UsersTable />} />
            <Route path="curriculum/create" element={<CurriculumCreate />} />
            <Route path="curriculum" element={<CurriculumTable />} />
            <Route path="timetable/create" element={<TimetableCreatePage />} />
            <Route path="timetable/day/:isoDate" element={<TimetableDayPage />} />
            <Route
              path="timetable/curricula/:curriculumId/classes/:classId/timetables/:timetableId"
              element={<TimetableManagePage />}
            />
            <Route path="timetable" element={<Timetable />} />
            <Route path="elimu-plus-online/lessons" element={<OnlineScheduledLessonsPage />} />
            <Route path="elimu-plus-online/exams" element={<OnlineScheduledExamsPage />} />
            <Route path="elimu-plus-online" element={<ElimuPlusOnlineHub />} />
            <Route path="live-class/:liveClassId" element={<LiveClassRoomPage />} />
            <Route path="live/event/:eventId" element={<EventLiveRoomPage />} />
            <Route path="marketplace" element={<Marketplace />} />
            <Route path="marketplace/training-events/create" element={<TrainingEventCreate />} />
            <Route path="marketplace/training-events/:id" element={<TrainingEventView />} />
            <Route path="marketplace/training-events/:id/edit" element={<TrainingEventEdit />} />
            <Route path="marketplace/grants/create" element={<GrantCreate />} />
            <Route path="marketplace/grants/:id" element={<GrantView />} />
            <Route path="marketplace/grants/:id/edit" element={<GrantEdit />} />
            <Route path="marketplace/partners/create" element={<PartnerCreate />} />
            <Route path="marketplace/partners/:id" element={<PartnerView />} />
            <Route path="marketplace/partners/:id/edit" element={<PartnerEdit />} />
            <Route path="marketplace/job-opportunities/create" element={<JobOpportunityCreate />} />
            <Route path="marketplace/job-opportunities/:id" element={<JobOpportunityView />} />
            <Route path="marketplace/job-opportunities/:id/edit" element={<JobOpportunityEdit />} />
            <Route path="settings" element={<Settings user={user} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        )}
      </Box>
    </Box>
  );
}

export default PageRoutes;
