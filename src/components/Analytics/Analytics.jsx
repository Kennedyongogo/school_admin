import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  TextField,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector,
  LineChart,
  Line,
  Area,
  AreaChart,
  Scatter,
  ScatterChart,
  ZAxis,
} from "recharts";
import {
  Analytics as AnalyticsIcon,
  TrendingUp,
  TrendingUp as TrendingUpIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Map as MapIcon,
  Speed as GaugeIcon,
  Timeline,
  Help as HelpIcon,
  Info as InfoIcon,
  People as PeopleIcon,
  LocationOn as LocationIcon,
  Speed as GaugeIcon2,
  Assessment as AssessmentIcon,
  Insights as InsightsIcon,
  Refresh as RefreshIcon,
  Description as DescriptionIcon,
  AccountCircle as AccountCircleIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Star as StarIcon,
  Article as ArticleIcon,
  Hotel as HotelIcon,
  ShoppingBag as ShoppingBagIcon,
  PhotoLibrary as PhotoLibraryIcon,
  Assignment as AssignmentIcon,
  RateReview as RateReviewIcon,
  Visibility as VisibilityIcon,
  Favorite as FavoriteIcon,
  List as ListIcon,
  Schedule as ScheduleIcon,
  History as HistoryIcon,
  Build as BuildIcon,
  Business as BusinessIcon,
  QuestionAnswer as QuestionAnswerIcon,
  ContactMail as ContactMailIcon,
  RequestQuote as RequestQuoteIcon,
  Email as EmailIcon,
} from "@mui/icons-material";

// Color palette for charts (brown/rust theme)
const COLORS = [
  "#6B4E3D",
  "#B85C38",
  "#8B4225",
  "#A0522D",
  "#CD853F",
  "#D2691E",
  "#DEB887",
  "#F4A460",
  "#D2B48C",
  "#BC8F8F",
];

const Analytics = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({
    overview: {},
    adminUsers: {},
    documents: {},
    auditTrail: {},
    reviews: {},
    blogs: {},
    members: {},
    lodges: {},
    packages: {},
    routeStages: {},
    destinations: {},
    gallery: {},
    forms: {},
    formFields: {},
    fieldOptions: {},
    formSubmissions: {},
    trends: {},
  });
  const [dashboardStats, setDashboardStats] = useState(null);
  // Helper function to format date for display
  const formatDateForDisplay = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1)
      .toISOString()
      .split("T")[0], // January 1st of current year
    endDate: new Date(new Date().getFullYear(), 11, 31)
      .toISOString()
      .split("T")[0], // December 31st of current year
  });

  const [overviewHelpOpen, setOverviewHelpOpen] = useState(false);
  const [reviewsHelpOpen, setReviewsHelpOpen] = useState(false);
  const [blogsHelpOpen, setBlogsHelpOpen] = useState(false);
  const [galleryHelpOpen, setGalleryHelpOpen] = useState(false);
  const [formsHelpOpen, setFormsHelpOpen] = useState(false);

  const tabs = [
    { label: "Overview", icon: <AnalyticsIcon />, value: 0 },
    { label: "Reviews", icon: <StarIcon />, value: 1 },
    { label: "Blogs", icon: <ArticleIcon />, value: 2 },
    { label: "Gallery", icon: <PhotoLibraryIcon />, value: 3 },
    { label: "Forms", icon: <AssignmentIcon />, value: 4 },
  ];

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No authentication token found");
      }

      const [analyticsRes, dashboardRes] = await Promise.all([
        fetch("/api/analytics", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch("/api/admin-users/dashboard/stats", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      if (!analyticsRes.ok) {
        throw new Error(`HTTP error! status: ${analyticsRes.status}`);
      }

      const data = await analyticsRes.json();
      if (data.success) {
        setAnalyticsData(data.data);
        setDataLoaded(true);
      } else {
        throw new Error(data.message || "Failed to fetch analytics data");
      }

      if (dashboardRes.ok) {
        const dashboardData = await dashboardRes.json();
        if (dashboardData.success && dashboardData.data?.stats) {
          setDashboardStats(dashboardData.data.stats);
        }
      }
    } catch (err) {
      console.error("Error fetching analytics data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  // Overview Help Dialog Component
  const OverviewHelpDialog = () => (
    <Dialog
      open={overviewHelpOpen}
      onClose={() => setOverviewHelpOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <InfoIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Platform Overview – Data Explanation
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          This overview shows platform-wide counts (excluding marketplace). It includes admin users, content, inquiries, forms, and system activity. Marketplace stats (users, listings, training, grants, etc.) are on the Marketplace page.
        </Typography>

        {/* Key Metrics Cards */}
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 3 }}>
          📊 Key Metrics Cards
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <PeopleIcon color="warning" />
            </ListItemIcon>
            <ListItemText
              primary="Admin Users"
              secondary="Total number of admin users in the system"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <AccountCircleIcon color="info" />
            </ListItemIcon>
            <ListItemText
              primary="Active Admins"
              secondary="Number of admins currently active"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <DescriptionIcon color="success" />
            </ListItemIcon>
            <ListItemText
              primary="Documents"
              secondary="Total documents stored in the system"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <HistoryIcon color="action" />
            </ListItemIcon>
            <ListItemText
              primary="Audit Logs"
              secondary="Total audit trail entries (system activity log)"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <StarIcon color="warning" />
            </ListItemIcon>
            <ListItemText
              primary="Reviews"
              secondary="Total customer or testimonial reviews"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <ArticleIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Blogs"
              secondary="Total blog posts published"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <PeopleIcon color="secondary" />
            </ListItemIcon>
            <ListItemText
              primary="Members"
              secondary="Total member or agent partnership applications"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <BuildIcon color="inherit" />
            </ListItemIcon>
            <ListItemText
              primary="Services"
              secondary="Total services offered on the platform"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <BusinessIcon color="inherit" />
            </ListItemIcon>
            <ListItemText
              primary="Projects"
              secondary="Total projects in the system"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <QuestionAnswerIcon color="inherit" />
            </ListItemIcon>
            <ListItemText
              primary="FAQs"
              secondary="Total frequently asked questions"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <ContactMailIcon color="inherit" />
            </ListItemIcon>
            <ListItemText
              primary="Contacts"
              secondary="Total contact form submissions"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <RequestQuoteIcon color="inherit" />
            </ListItemIcon>
            <ListItemText
              primary="Quote Requests"
              secondary="Total quote request submissions"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <ScheduleIcon color="inherit" />
            </ListItemIcon>
            <ListItemText
              primary="Consultations"
              secondary="Total consultation requests"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <EmailIcon color="inherit" />
            </ListItemIcon>
            <ListItemText
              primary="Newsletter Subscribers"
              secondary="Total newsletter sign-ups"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <PhotoLibraryIcon color="secondary" />
            </ListItemIcon>
            <ListItemText
              primary="Interest Gallery"
              secondary="Total gallery items (images/videos)"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <AssignmentIcon color="warning" />
            </ListItemIcon>
            <ListItemText
              primary="Forms"
              secondary="Total forms created in the system"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="success" />
            </ListItemIcon>
            <ListItemText
              primary="Form Submissions"
              secondary="Total form submissions received"
            />
          </ListItem>
        </List>

        {/* Quick Stats Sections */}
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 3 }}>
          📈 Quick Stats Sections
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <Chip label="Review Metrics" color="warning" size="small" />
            </ListItemIcon>
            <ListItemText
              primary="Review Metrics"
              secondary="Shows average rating and recent reviews (30 days)"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Chip label="Blog Metrics" color="primary" size="small" />
            </ListItemIcon>
            <ListItemText
              primary="Blog Metrics"
              secondary="Displays total views, likes, and engagement metrics"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Chip label="Recent Activity" color="warning" size="small" />
            </ListItemIcon>
            <ListItemText
              primary="Recent Activity"
              secondary="Shows activity count for the last 7 days and number of active users"
            />
          </ListItem>
        </List>

        {/* Additional Charts */}
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 3 }}>
          📊 Additional Analytics Charts
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <BarChartIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Documents by Type"
              secondary="Bar chart showing distribution of documents by file type (Image, PDF, Word, Excel, PowerPoint, Text, Other)"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <BarChartIcon color="secondary" />
            </ListItemIcon>
            <ListItemText
              primary="Users by Role"
              secondary="Bar chart showing distribution of users by their roles (super-admin, admin, regular user)"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <AssessmentIcon color="success" />
            </ListItemIcon>
            <ListItemText
              primary="Activity by Action (Last 7 Days)"
              secondary="Bar chart showing system activity breakdown by action type (create, update, delete, login, status_change)"
            />
          </ListItem>
        </List>

        {/* 30-Day Trends */}
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 3 }}>
          📅 30-Day Trends Summary
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <Chip label="New Reviews" color="warning" size="small" />
            </ListItemIcon>
            <ListItemText
              primary="New Reviews"
              secondary="Number of new reviews received in the last 30 days"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Chip label="New Blogs" color="primary" size="small" />
            </ListItemIcon>
            <ListItemText
              primary="New Blogs"
              secondary="Number of new blog posts published in the last 30 days"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Chip label="New Agent Applications" color="secondary" size="small" />
            </ListItemIcon>
            <ListItemText
              primary="New Agent Applications"
              secondary="Number of new agent partnership applications in the last 30 days"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Chip label="New Interest Gallery Items" color="info" size="small" />
            </ListItemIcon>
            <ListItemText
              primary="New Interest Gallery Items"
              secondary="Number of new gallery items added in the last 30 days"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Chip label="New Form Submissions" color="warning" size="small" />
            </ListItemIcon>
            <ListItemText
              primary="New Form Submissions"
              secondary="Number of new form submissions in the last 30 days"
            />
          </ListItem>
        </List>

        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>💡 Tip:</strong> These metrics cover the main platform (no marketplace). Use them to track content, inquiries, and system activity. For marketplace stats (users, listings, training, grants), open the Marketplace section.
          </Typography>
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOverviewHelpOpen(false)} color="primary">
          Got it!
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Reviews Help Dialog Component
  const ReviewsHelpDialog = () => (
    <Dialog
      open={reviewsHelpOpen}
      onClose={() => setReviewsHelpOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <StarIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Reviews Analytics Explanation
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          The Reviews tab provides insights into customer reviews, ratings, and review status distribution.
        </Typography>
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 3 }}>
          📊 Review Metrics
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon><StarIcon color="warning" /></ListItemIcon>
            <ListItemText
              primary="Total Reviews"
              secondary="The total number of customer reviews in the system"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
            <ListItemText
              primary="Average Rating"
              secondary="The average rating across all reviews (1-5 stars)"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><TrendingUpIcon color="primary" /></ListItemIcon>
            <ListItemText
              primary="Recent (30d)"
              secondary="Number of new reviews received in the last 30 days"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
            <ListItemText
              primary="Approved"
              secondary="Number of reviews that have been approved and published"
            />
          </ListItem>
        </List>
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 3 }}>
          📈 Charts
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon><PieChartIcon color="primary" /></ListItemIcon>
            <ListItemText
              primary="Review Status Distribution"
              secondary="Pie chart showing reviews by status (approved, pending, rejected)"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><BarChartIcon color="secondary" /></ListItemIcon>
            <ListItemText
              primary="Rating Distribution"
              secondary="Bar chart showing number of reviews by rating (1-5 stars)"
            />
          </ListItem>
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setReviewsHelpOpen(false)} color="primary">Got it!</Button>
      </DialogActions>
    </Dialog>
  );

  // Blogs Help Dialog Component
  const BlogsHelpDialog = () => (
    <Dialog
      open={blogsHelpOpen}
      onClose={() => setBlogsHelpOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <ArticleIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Blogs Analytics Explanation
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          The Blogs tab provides insights into blog posts, categories, engagement metrics, and status distribution.
        </Typography>
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 3 }}>
          📊 Blog Metrics
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon><ArticleIcon color="primary" /></ListItemIcon>
            <ListItemText
              primary="Total Blogs"
              secondary="The total number of blog posts in the system"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><StarIcon color="warning" /></ListItemIcon>
            <ListItemText
              primary="Featured"
              secondary="Number of blog posts marked as featured"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><VisibilityIcon color="info" /></ListItemIcon>
            <ListItemText
              primary="Total Views"
              secondary="Total number of views across all blog posts"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><FavoriteIcon color="error" /></ListItemIcon>
            <ListItemText
              primary="Total Likes"
              secondary="Total number of likes across all blog posts"
            />
          </ListItem>
        </List>
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 3 }}>
          📈 Charts
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon><PieChartIcon color="primary" /></ListItemIcon>
            <ListItemText
              primary="Blog Status Distribution"
              secondary="Pie chart showing blogs by status (published, draft, archived)"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><BarChartIcon color="secondary" /></ListItemIcon>
            <ListItemText
              primary="Blog Category Distribution"
              secondary="Bar chart showing number of blogs by category"
            />
          </ListItem>
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setBlogsHelpOpen(false)} color="primary">Got it!</Button>
      </DialogActions>
    </Dialog>
  );

  // Gallery Help Dialog Component
  const GalleryHelpDialog = () => (
    <Dialog
      open={galleryHelpOpen}
      onClose={() => setGalleryHelpOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <PhotoLibraryIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Gallery Analytics Explanation
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          The Gallery tab provides insights into gallery items, types (images/videos), categories, and featured items.
        </Typography>
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 3 }}>
          📊 Metrics
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon><PhotoLibraryIcon color="secondary" /></ListItemIcon>
            <ListItemText
              primary="Total Items"
              secondary="The total number of gallery items (images and videos)"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
            <ListItemText
              primary="Active Items"
              secondary="Number of gallery items currently active and visible"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><StarIcon color="warning" /></ListItemIcon>
            <ListItemText
              primary="Featured"
              secondary="Number of gallery items marked as featured"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><TrendingUpIcon color="primary" /></ListItemIcon>
            <ListItemText
              primary="Recent (30d)"
              secondary="Number of new gallery items added in the last 30 days"
            />
          </ListItem>
        </List>
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 3 }}>
          📈 Charts
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon><PieChartIcon color="primary" /></ListItemIcon>
            <ListItemText
              primary="Gallery Items by Type"
              secondary="Pie chart showing distribution by type (image, video)"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><BarChartIcon color="secondary" /></ListItemIcon>
            <ListItemText
              primary="Gallery Items by Category"
              secondary="Bar chart showing distribution by category"
            />
          </ListItem>
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setGalleryHelpOpen(false)} color="primary">Got it!</Button>
      </DialogActions>
    </Dialog>
  );

  // Forms Help Dialog Component
  const FormsHelpDialog = () => (
    <Dialog
      open={formsHelpOpen}
      onClose={() => setFormsHelpOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <AssignmentIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Forms Analytics Explanation
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          The Forms tab provides insights into forms, form fields, field options, and form submissions.
        </Typography>
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 3 }}>
          📊 Metrics
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon><AssignmentIcon color="warning" /></ListItemIcon>
            <ListItemText
              primary="Total Forms"
              secondary="The total number of forms created in the system"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
            <ListItemText
              primary="Active Forms"
              secondary="Number of forms currently active and available"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><DescriptionIcon color="primary" /></ListItemIcon>
            <ListItemText
              primary="Form Fields"
              secondary="Total number of form fields across all forms"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><ListIcon color="secondary" /></ListItemIcon>
            <ListItemText
              primary="Field Options"
              secondary="Total number of field options (for dropdowns, checkboxes, etc.)"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><CheckCircleIcon color="info" /></ListItemIcon>
            <ListItemText
              primary="Submissions"
              secondary="Total number of form submissions received"
            />
          </ListItem>
        </List>
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 3 }}>
          📈 Charts
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon><PieChartIcon color="primary" /></ListItemIcon>
            <ListItemText
              primary="Form Submission Status"
              secondary="Pie chart showing submissions by status (pending, approved, rejected)"
            />
          </ListItem>
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setFormsHelpOpen(false)} color="primary">Got it!</Button>
      </DialogActions>
    </Dialog>
  );

  // Projects Help Dialog Component
  const ProjectsHelpDialog = () => (
    <Dialog
      open={projectsHelpOpen}
      onClose={() => setProjectsHelpOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <MapIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Projects Data Explanation
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          The Projects tab provides comprehensive insights into your foundation's project portfolio, 
          including status distribution, categories, geographical spread, and progress metrics. 
          Here's how to understand what you're seeing:
        </Typography>

        {/* Project Summary Cards */}
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 3 }}>
          📊 Project Summary Cards
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <MapIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Total Projects"
              secondary="The total number of projects currently managed by the foundation"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <AssessmentIcon color="secondary" />
            </ListItemIcon>
            <ListItemText
              primary="Average Progress"
              secondary="The average completion percentage across all projects"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <TrendingUpIcon color="success" />
            </ListItemIcon>
            <ListItemText
              primary="Completion Rate"
              secondary="The percentage of projects that have been completed"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="info" />
            </ListItemIcon>
            <ListItemText
              primary="Completed Projects"
              secondary="The total number of projects that have been finished"
            />
          </ListItem>
        </List>

        {/* Progress Statistics */}
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 3 }}>
          📈 Progress Statistics
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <Chip label="Minimum Progress" color="info" size="small" />
            </ListItemIcon>
            <ListItemText
              primary="Minimum Progress"
              secondary="The lowest progress percentage among all projects"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Chip label="Maximum Progress" color="success" size="small" />
            </ListItemIcon>
            <ListItemText
              primary="Maximum Progress"
              secondary="The highest progress percentage among all projects"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Chip label="Average Progress" color="primary" size="small" />
            </ListItemIcon>
            <ListItemText
              primary="Average Progress"
              secondary="The mean progress percentage across all projects"
            />
          </ListItem>
        </List>

        {/* Project Status Distribution */}
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 3 }}>
          📊 Project Status Distribution
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <Chip label="Pending" color="warning" size="small" />
            </ListItemIcon>
            <ListItemText
              primary="Pending"
              secondary="Projects that are approved but not yet started"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Chip label="In Progress" color="primary" size="small" />
            </ListItemIcon>
            <ListItemText
              primary="In Progress"
              secondary="Projects currently being implemented"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Chip label="On Hold" color="default" size="small" />
            </ListItemIcon>
            <ListItemText
              primary="On Hold"
              secondary="Projects temporarily paused due to various reasons"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Chip label="Completed" color="success" size="small" />
            </ListItemIcon>
            <ListItemText
              primary="Completed"
              secondary="Projects that have been successfully finished"
            />
          </ListItem>
        </List>

        {/* Project Category Distribution */}
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 3 }}>
          🏗️ Project Category Distribution
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <PeopleIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Volunteer"
              secondary="Projects focused on volunteer programs and community service"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <AssessmentIcon color="secondary" />
            </ListItemIcon>
            <ListItemText
              primary="Education"
              secondary="Educational initiatives, schools, and learning programs"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <InfoIcon color="success" />
            </ListItemIcon>
            <ListItemText
              primary="Mental Health"
              secondary="Mental health awareness, counseling, and support programs"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <LocationIcon color="warning" />
            </ListItemIcon>
            <ListItemText
              primary="Community"
              secondary="Community development and social welfare projects"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <TrendingUpIcon color="info" />
            </ListItemIcon>
            <ListItemText
              primary="Donation"
              secondary="Fundraising and donation management projects"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <GaugeIcon color="default" />
            </ListItemIcon>
            <ListItemText
              primary="Partnership"
              secondary="Collaborative projects with other organizations"
            />
          </ListItem>
        </List>

        {/* Geographical Distribution */}
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 3 }}>
          🌍 Geographical Distribution
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <LocationIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Projects by County"
              secondary="Distribution of projects across different counties in Kenya"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <MapIcon color="secondary" />
            </ListItemIcon>
            <ListItemText
              primary="Geographic Spread"
              secondary="Visual representation of project locations and coverage"
            />
          </ListItem>
        </List>

        {/* Visual Charts */}
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 3 }}>
          📊 Visual Analytics
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <PieChartIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Project Status Pie Chart"
              secondary="Visual breakdown of projects by status (pending, in progress, on hold, completed)"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <BarChartIcon color="secondary" />
            </ListItemIcon>
            <ListItemText
              primary="Category Bar Chart"
              secondary="Bar chart showing distribution of projects by category"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <AssessmentIcon color="success" />
            </ListItemIcon>
            <ListItemText
              primary="County Distribution Chart"
              secondary="Bar chart showing projects distributed across different counties"
            />
          </ListItem>
        </List>

        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>💡 Tip:</strong> Use these metrics to track project performance, 
            identify areas needing attention, understand your foundation's impact across 
            different categories and regions, and make data-driven decisions for future projects.
          </Typography>
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setProjectsHelpOpen(false)} color="primary">
          Got it!
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Inquiries Help Dialog Component
  const InquiriesHelpDialog = () => (
    <Dialog
      open={inquiriesHelpOpen}
      onClose={() => setInquiriesHelpOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <BarChartIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Inquiries Data Explanation
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          The Inquiries tab provides comprehensive insights into all inquiries received by the foundation, 
          including status distribution, category breakdown, and resolution performance. Here's how to understand what you're seeing:
        </Typography>

        {/* Summary Cards */}
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 3 }}>
          📊 Summary Cards
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <InfoIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Total Inquiries"
              secondary="The total number of inquiries received by the foundation from the public"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Timeline color="warning" />
            </ListItemIcon>
            <ListItemText
              primary="Pending Inquiries"
              secondary="Number of inquiries waiting to be addressed or currently being reviewed"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <TrendingUp color="success" />
            </ListItemIcon>
            <ListItemText
              primary="Resolved Inquiries"
              secondary="Number of inquiries that have been successfully addressed and closed"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <GaugeIcon color="secondary" />
            </ListItemIcon>
            <ListItemText
              primary="Average Resolution Time"
              secondary="The average time (in hours) it takes to resolve an inquiry from submission to resolution"
            />
          </ListItem>
        </List>

        {/* Inquiry Status Distribution */}
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 3 }}>
          📈 Inquiry Status Distribution
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <Chip label="Pending" color="warning" size="small" />
            </ListItemIcon>
            <ListItemText
              primary="Pending"
              secondary="Inquiries that have been received but not yet started being processed"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Chip label="In Progress" color="primary" size="small" />
            </ListItemIcon>
            <ListItemText
              primary="In Progress"
              secondary="Inquiries currently being reviewed and worked on by the team"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Chip label="Resolved" color="success" size="small" />
            </ListItemIcon>
            <ListItemText
              primary="Resolved"
              secondary="Inquiries that have been successfully addressed and closed"
            />
          </ListItem>
        </List>

        {/* Inquiry Category Distribution */}
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 3 }}>
          🏷️ Inquiry Category Distribution
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <PeopleIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Volunteer"
              secondary="Inquiries related to volunteer opportunities, applications, and volunteer programs"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <AssessmentIcon color="secondary" />
            </ListItemIcon>
            <ListItemText
              primary="Education"
              secondary="Inquiries about educational programs, scholarships, and learning opportunities"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <InfoIcon color="success" />
            </ListItemIcon>
            <ListItemText
              primary="Mental Health"
              secondary="Inquiries regarding mental health services, counseling, and support resources"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <LocationIcon color="warning" />
            </ListItemIcon>
            <ListItemText
              primary="Community"
              secondary="General community inquiries, event information, and local initiatives"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <TrendingUpIcon color="info" />
            </ListItemIcon>
            <ListItemText
              primary="Donation"
              secondary="Inquiries about making donations, fundraising events, and contribution methods"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <GaugeIcon color="default" />
            </ListItemIcon>
            <ListItemText
              primary="Partnership"
              secondary="Inquiries from organizations interested in partnering with the foundation"
            />
          </ListItem>
        </List>

        {/* Visual Charts */}
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 3 }}>
          📊 Visual Analytics
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <PieChartIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Inquiry Status Pie Chart"
              secondary="Visual breakdown of all inquiries by their current status (pending, in progress, resolved)"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <BarChartIcon color="secondary" />
            </ListItemIcon>
            <ListItemText
              primary="Category Bar Chart"
              secondary="Bar chart showing the distribution of inquiries across different categories"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <AssessmentIcon color="success" />
            </ListItemIcon>
            <ListItemText
              primary="Category Breakdown Table"
              secondary="Detailed table showing inquiry count and percentage for each category"
            />
          </ListItem>
        </List>

        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>💡 Tip:</strong> Monitor these metrics regularly to ensure timely responses to inquiries, 
            identify popular inquiry categories, and improve your foundation's response times. 
            A lower average resolution time indicates better service quality and responsiveness.
          </Typography>
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setInquiriesHelpOpen(false)} color="primary">
          Got it!
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Tasks & Labor Help Dialog Component
  const TasksLaborHelpDialog = () => (
    <Dialog
      open={tasksLaborHelpOpen}
      onClose={() => setTasksLaborHelpOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <BarChartIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Tasks & Labor Tab - Data Explanation
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          The Tasks & Labor tab shows task status distribution, labor workforce
          analysis, and recent task information. Here's how to understand what
          you're seeing:
        </Typography>

        {/* Task Status Chart */}
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 3 }}>
          📊 Task Status Distribution
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <Chip label="Pending" color="warning" size="small" />
            </ListItemIcon>
            <ListItemText
              primary="Pending"
              secondary="Tasks that are assigned but not yet started"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Chip label="In Progress" color="primary" size="small" />
            </ListItemIcon>
            <ListItemText
              primary="In Progress"
              secondary="Tasks currently being worked on"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Chip label="Completed" color="success" size="small" />
            </ListItemIcon>
            <ListItemText
              primary="Completed"
              secondary="Tasks that have been finished"
            />
          </ListItem>
        </List>

        {/* Labor Type Chart */}
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 3 }}>
          👷 Labor by Worker Type
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <PeopleIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Foreman"
              secondary="Supervisory workers who oversee construction activities"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <AssessmentIcon color="secondary" />
            </ListItemIcon>
            <ListItemText
              primary="Skilled Worker"
              secondary="Workers with specialized skills and training"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <GaugeIcon color="success" />
            </ListItemIcon>
            <ListItemText
              primary="Unskilled Worker"
              secondary="General laborers without specialized training"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <InfoIcon color="warning" />
            </ListItemIcon>
            <ListItemText
              primary="Engineer"
              secondary="Technical professionals with engineering qualifications"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <TrendingUp color="info" />
            </ListItemIcon>
            <ListItemText
              primary="Supervisor"
              secondary="Management-level workers who coordinate teams"
            />
          </ListItem>
        </List>

        {/* Labor Summary */}
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 3 }}>
          💰 Labor Summary
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <AssessmentIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Total Hours"
              secondary="Total number of hours worked across all labor"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <PieChartIcon color="secondary" />
            </ListItemIcon>
            <ListItemText
              primary="Total Cost"
              secondary="Total cost of all labor (hours × hourly rates)"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <GaugeIcon color="success" />
            </ListItemIcon>
            <ListItemText
              primary="Average Hourly Rate"
              secondary="Average hourly wage across all workers"
            />
          </ListItem>
        </List>

        {/* Recent Tasks */}
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 3 }}>
          📋 Recent Tasks
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <BarChartIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Task Name"
              secondary="The name of the construction task"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <AssessmentIcon color="secondary" />
            </ListItemIcon>
            <ListItemText
              primary="Project & Progress"
              secondary="Which project the task belongs to and its completion percentage"
            />
          </ListItem>
        </List>

        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>💡 Tip:</strong> Use these charts to track task progress,
            manage labor resources, and identify workforce distribution patterns
            across your construction projects.
          </Typography>
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setTasksLaborHelpOpen(false)} color="primary">
          Got it!
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Budget & Resources Help Dialog Component
  const BudgetResourcesHelpDialog = () => (
    <Dialog
      open={budgetResourcesHelpOpen}
      onClose={() => setBudgetResourcesHelpOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <PieChartIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Budget & Resources Tab - Data Explanation
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          The Budget & Resources tab shows budget analysis, resource allocation,
          and financial metrics. Here's how to understand what you're seeing:
        </Typography>

        {/* Budget Overview */}
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 3 }}>
          💰 Budget Overview
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <PieChartIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Total Budgeted"
              secondary="Total amount allocated for all projects and resources"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <AssessmentIcon color="secondary" />
            </ListItemIcon>
            <ListItemText
              primary="Total Actual"
              secondary="Total amount actually spent across all projects"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <TrendingUp color="success" />
            </ListItemIcon>
            <ListItemText
              primary="Variance"
              secondary="Difference between budgeted and actual costs (Budgeted - Actual)"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <GaugeIcon color="warning" />
            </ListItemIcon>
            <ListItemText
              primary="Utilization"
              secondary="Percentage of budget that has been used (Actual ÷ Budgeted × 100)"
            />
          </ListItem>
        </List>

        {/* Budget by Category */}
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 3 }}>
          📊 Budget by Category
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <Chip label="Materials" color="primary" size="small" />
            </ListItemIcon>
            <ListItemText
              primary="Materials"
              secondary="Budget allocated for construction materials (cement, steel, etc.)"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Chip label="Labor" color="secondary" size="small" />
            </ListItemIcon>
            <ListItemText
              primary="Labor"
              secondary="Budget allocated for workforce costs and wages"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Chip label="Equipment" color="success" size="small" />
            </ListItemIcon>
            <ListItemText
              primary="Equipment"
              secondary="Budget allocated for equipment rental and maintenance"
            />
          </ListItem>
        </List>

        {/* Project Resource Allocation */}
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 3 }}>
          🏗️ Project Resource Allocation
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <MapIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Project Name"
              secondary="Name of the construction project"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <AssessmentIcon color="secondary" />
            </ListItemIcon>
            <ListItemText
              primary="Status & Progress"
              secondary="Current project status and completion percentage"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <GaugeIcon color="success" />
            </ListItemIcon>
            <ListItemText
              primary="Resource Counts"
              secondary="Number of materials, labor, and equipment assigned to each project"
            />
          </ListItem>
        </List>

        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>💡 Tip:</strong> Use these metrics to track budget
            performance, identify cost overruns, and ensure proper resource
            allocation across your construction projects.
          </Typography>
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => setBudgetResourcesHelpOpen(false)}
          color="primary"
        >
          Got it!
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Performance Help Dialog Component
  const PerformanceHelpDialog = () => (
    <Dialog
      open={performanceHelpOpen}
      onClose={() => setPerformanceHelpOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Timeline color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Performance Tab - Data Explanation
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          The Performance tab shows task completion rates, material utilization,
          and project performance indicators. Here's how to understand what
          you're seeing:
        </Typography>

        {/* Performance Overview */}
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 3 }}>
          📊 Performance Overview
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <AssessmentIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Task Completion Rate"
              secondary="Percentage of tasks that have been completed across all projects"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <TrendingUp color="success" />
            </ListItemIcon>
            <ListItemText
              primary="Completed Tasks"
              secondary="Total number of tasks that have been finished"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <GaugeIcon color="warning" />
            </ListItemIcon>
            <ListItemText
              primary="In Progress Tasks"
              secondary="Total number of tasks currently being worked on"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <InfoIcon color="error" />
            </ListItemIcon>
            <ListItemText
              primary="Projects at Risk"
              secondary="Number of projects that may be behind schedule or over budget"
            />
          </ListItem>
        </List>

        {/* Material Utilization */}
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 3 }}>
          🏗️ Material Utilization
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <PieChartIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Total Required"
              secondary="Total amount of materials needed across all projects"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <AssessmentIcon color="secondary" />
            </ListItemIcon>
            <ListItemText
              primary="Total Used"
              secondary="Total amount of materials actually consumed"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <GaugeIcon color="success" />
            </ListItemIcon>
            <ListItemText
              primary="Utilization Percentage"
              secondary="Percentage of materials that have been used (Used ÷ Required × 100)"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <TrendingUp color="warning" />
            </ListItemIcon>
            <ListItemText
              primary="Total Cost"
              secondary="Total cost of all materials budgeted for projects"
            />
          </ListItem>
        </List>

        {/* Equipment & Cost Summary */}
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 3 }}>
          🔧 Equipment & Cost Summary
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <GaugeIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Total Equipment"
              secondary="Total number of equipment items in your inventory"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <TrendingUp color="success" />
            </ListItemIcon>
            <ListItemText
              primary="Available Equipment"
              secondary="Number of equipment items currently available for use"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <PieChartIcon color="warning" />
            </ListItemIcon>
            <ListItemText
              primary="Daily Rental Cost"
              secondary="Total daily cost for all equipment rentals"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <AssessmentIcon color="error" />
            </ListItemIcon>
            <ListItemText
              primary="Overdue Tasks"
              secondary="Number of tasks that are past their due date"
            />
          </ListItem>
        </List>

        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>💡 Tip:</strong> Use these metrics to track project
            performance, identify bottlenecks, and ensure efficient resource
            utilization across your construction projects.
          </Typography>
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setPerformanceHelpOpen(false)} color="primary">
          Got it!
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Equipment & Materials Help Dialog Component
  const EquipmentMaterialsHelpDialog = () => (
    <Dialog
      open={equipmentMaterialsHelpOpen}
      onClose={() => setEquipmentMaterialsHelpOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <GaugeIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Equipment & Materials Tab - Data Explanation
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          The Equipment & Materials tab shows equipment availability, material
          utilization, and resource management. Here's how to understand what
          you're seeing:
        </Typography>

        {/* Equipment Availability */}
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 3 }}>
          🔧 Equipment Availability
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <Chip label="Available" color="success" size="small" />
            </ListItemIcon>
            <ListItemText
              primary="Available Equipment"
              secondary="Equipment items that are currently free and ready for use"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Chip label="Unavailable" color="error" size="small" />
            </ListItemIcon>
            <ListItemText
              primary="Unavailable Equipment"
              secondary="Equipment items that are currently in use or under maintenance"
            />
          </ListItem>
        </List>

        {/* Labor Status Distribution */}
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 3 }}>
          👷 Labor Status Distribution
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <Chip label="Active" color="success" size="small" />
            </ListItemIcon>
            <ListItemText
              primary="Active Workers"
              secondary="Workers currently assigned to projects and working"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Chip label="Completed" color="info" size="small" />
            </ListItemIcon>
            <ListItemText
              primary="Completed Workers"
              secondary="Workers who have finished their assigned tasks"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Chip label="On Leave" color="warning" size="small" />
            </ListItemIcon>
            <ListItemText
              primary="On Leave Workers"
              secondary="Workers who are temporarily unavailable (vacation, sick leave, etc.)"
            />
          </ListItem>
        </List>

        {/* Material Summary */}
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 3 }}>
          🏗️ Material Summary
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <PieChartIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Total Required"
              secondary="Total amount of materials needed across all projects"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <AssessmentIcon color="secondary" />
            </ListItemIcon>
            <ListItemText
              primary="Total Used"
              secondary="Total amount of materials actually consumed"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <GaugeIcon color="success" />
            </ListItemIcon>
            <ListItemText
              primary="Utilization Percentage"
              secondary="Percentage of materials that have been used (Used ÷ Required × 100)"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <TrendingUp color="warning" />
            </ListItemIcon>
            <ListItemText
              primary="Total Cost"
              secondary="Total cost of all materials budgeted for projects"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <InfoIcon color="error" />
            </ListItemIcon>
            <ListItemText
              primary="Total Spent"
              secondary="Total amount actually spent on materials"
            />
          </ListItem>
        </List>

        {/* Equipment Summary */}
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 3 }}>
          🔧 Equipment Summary
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <TrendingUp color="success" />
            </ListItemIcon>
            <ListItemText
              primary="Available Equipment"
              secondary="Number of equipment items currently available for use"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <GaugeIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Total Equipment"
              secondary="Total number of equipment items in your inventory"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <PieChartIcon color="warning" />
            </ListItemIcon>
            <ListItemText
              primary="Daily Rental Cost"
              secondary="Total daily cost for all equipment rentals"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <AssessmentIcon color="info" />
            </ListItemIcon>
            <ListItemText
              primary="Equipment Utilization"
              secondary="Percentage of equipment that is currently available (Available ÷ Total × 100)"
            />
          </ListItem>
        </List>

        {/* Issues Summary */}
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 3 }}>
          ⚠️ Issues Summary
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <Chip label="Open" color="error" size="small" />
            </ListItemIcon>
            <ListItemText
              primary="Open Issues"
              secondary="Issues that have been reported but not yet resolved"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Chip label="Resolved" color="success" size="small" />
            </ListItemIcon>
            <ListItemText
              primary="Resolved Issues"
              secondary="Issues that have been successfully resolved"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Chip label="In Review" color="warning" size="small" />
            </ListItemIcon>
            <ListItemText
              primary="In Review Issues"
              secondary="Issues that are currently being investigated or reviewed"
            />
          </ListItem>
        </List>

        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>💡 Tip:</strong> Use these metrics to track resource
            utilization, identify equipment availability issues, and monitor
            material consumption patterns across your construction projects.
          </Typography>
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => setEquipmentMaterialsHelpOpen(false)}
          color="primary"
        >
          Got it!
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Modern Card Component (from Home.jsx)
  const ModernCard = ({ title, subtitle, icon, children }) => (
    <Card
      sx={{
        borderRadius: 3,
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        border: "1px solid rgba(107, 78, 61, 0.1)",
        boxShadow: "0 4px 20px rgba(107, 78, 61, 0.08)",
        transition: "all 0.3s ease",
        "&:hover": {
          boxShadow: "0 8px 30px rgba(184, 92, 56, 0.15)",
          transform: "translateY(-2px)",
          borderColor: "rgba(184, 92, 56, 0.2)",
        },
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backdropFilter: "blur(10px)",
      }}
    >
      <CardContent
        sx={{ p: 2, flex: 1, display: "flex", flexDirection: "column" }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 3,
          }}
        >
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              {icon && (
                <Avatar
                  sx={{
                    backgroundColor: "rgba(184, 92, 56, 0.1)",
                    color: "#B85C38",
                    mr: 2,
                    width: 40,
                    height: 40,
                    border: "1px solid rgba(184, 92, 56, 0.2)",
                  }}
                >
                  {icon}
                </Avatar>
              )}
              <Typography variant="h6" fontWeight="600" color="#2c3e50">
                {title}
              </Typography>
            </Box>
            {subtitle && (
              <Typography variant="body2" color="#7f8c8d">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {children}
        </Box>
      </CardContent>
    </Card>
  );

  // CardItem component with improved UI and appropriate icons
  const CardItem = (props) => {
    const getCardStyle = (title) => {
      switch (title) {
        case "Admin Users":
          return {
            icon: <PeopleIcon sx={{ fontSize: 40, color: "#f57c00" }} />,
            bgColor: "linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)",
            borderColor: "#f57c00",
            textColor: "#f57c00",
            iconBg: "rgba(245, 124, 0, 0.1)",
          };
        case "Active Admins":
          return {
            icon: <AccountCircleIcon sx={{ fontSize: 40, color: "#2e7d32" }} />,
            bgColor: "linear-gradient(135deg, #E8F5E8 0%, #C8E6C9 100%)",
            borderColor: "#2e7d32",
            textColor: "#2e7d32",
            iconBg: "rgba(46, 125, 50, 0.1)",
          };
        case "Documents":
          return {
            icon: <DescriptionIcon sx={{ fontSize: 40, color: "#388e3c" }} />,
            bgColor: "linear-gradient(135deg, #E8F5E8 0%, #C8E6C9 100%)",
            borderColor: "#388e3c",
            textColor: "#388e3c",
            iconBg: "rgba(56, 142, 60, 0.1)",
          };
        case "Audit Logs":
          return {
            icon: <HistoryIcon sx={{ fontSize: 40, color: "#546e7a" }} />,
            bgColor: "linear-gradient(135deg, #ECEFF1 0%, #CFD8DC 100%)",
            borderColor: "#546e7a",
            textColor: "#546e7a",
            iconBg: "rgba(84, 110, 122, 0.1)",
          };
        case "Reviews":
          return {
            icon: <StarIcon sx={{ fontSize: 40, color: "#ff9800" }} />,
            bgColor: "linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)",
            borderColor: "#ff9800",
            textColor: "#ff9800",
            iconBg: "rgba(255, 152, 0, 0.1)",
          };
        case "Blogs":
          return {
            icon: <ArticleIcon sx={{ fontSize: 40, color: "#1976d2" }} />,
            bgColor: "linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)",
            borderColor: "#1976d2",
            textColor: "#1976d2",
            iconBg: "rgba(25, 118, 210, 0.1)",
          };
        case "Members":
          return {
            icon: <PeopleIcon sx={{ fontSize: 40, color: "#7b1fa2" }} />,
            bgColor: "linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%)",
            borderColor: "#7b1fa2",
            textColor: "#7b1fa2",
            iconBg: "rgba(123, 31, 162, 0.1)",
          };
        case "Services":
          return {
            icon: <BuildIcon sx={{ fontSize: 40, color: "#00897b" }} />,
            bgColor: "linear-gradient(135deg, #E0F2F1 0%, #B2DFDB 100%)",
            borderColor: "#00897b",
            textColor: "#00897b",
            iconBg: "rgba(0, 137, 123, 0.1)",
          };
        case "Projects":
          return {
            icon: <BusinessIcon sx={{ fontSize: 40, color: "#6B4E3D" }} />,
            bgColor: "linear-gradient(135deg, #EFEBE9 0%, #D7CCC8 100%)",
            borderColor: "#6B4E3D",
            textColor: "#6B4E3D",
            iconBg: "rgba(107, 78, 61, 0.1)",
          };
        case "FAQs":
          return {
            icon: <QuestionAnswerIcon sx={{ fontSize: 40, color: "#3949ab" }} />,
            bgColor: "linear-gradient(135deg, #E8EAF6 0%, #C5CAE9 100%)",
            borderColor: "#3949ab",
            textColor: "#3949ab",
            iconBg: "rgba(57, 73, 171, 0.1)",
          };
        case "Contacts":
          return {
            icon: <ContactMailIcon sx={{ fontSize: 40, color: "#1565c0" }} />,
            bgColor: "linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)",
            borderColor: "#1565c0",
            textColor: "#1565c0",
            iconBg: "rgba(21, 101, 192, 0.1)",
          };
        case "Quote Requests":
          return {
            icon: <RequestQuoteIcon sx={{ fontSize: 40, color: "#0097a7" }} />,
            bgColor: "linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 100%)",
            borderColor: "#0097a7",
            textColor: "#0097a7",
            iconBg: "rgba(0, 151, 167, 0.1)",
          };
        case "Consultations":
          return {
            icon: <ScheduleIcon sx={{ fontSize: 40, color: "#e65100" }} />,
            bgColor: "linear-gradient(135deg, #FBE9E7 0%, #FFCCBC 100%)",
            borderColor: "#e65100",
            textColor: "#e65100",
            iconBg: "rgba(230, 81, 0, 0.1)",
          };
        case "Newsletter Subscribers":
          return {
            icon: <EmailIcon sx={{ fontSize: 40, color: "#c2185b" }} />,
            bgColor: "linear-gradient(135deg, #FCE4EC 0%, #F8BBD9 100%)",
            borderColor: "#c2185b",
            textColor: "#c2185b",
            iconBg: "rgba(194, 24, 91, 0.1)",
          };
        case "Interest Gallery":
          return {
            icon: <PhotoLibraryIcon sx={{ fontSize: 40, color: "#7b1fa2" }} />,
            bgColor: "linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%)",
            borderColor: "#7b1fa2",
            textColor: "#7b1fa2",
            iconBg: "rgba(123, 31, 162, 0.1)",
          };
        case "Forms":
          return {
            icon: <AssignmentIcon sx={{ fontSize: 40, color: "#f57c00" }} />,
            bgColor: "linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)",
            borderColor: "#f57c00",
            textColor: "#f57c00",
            iconBg: "rgba(245, 124, 0, 0.1)",
          };
        case "Form Submissions":
          return {
            icon: <CheckCircleIcon sx={{ fontSize: 40, color: "#43a047" }} />,
            bgColor: "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)",
            borderColor: "#43a047",
            textColor: "#43a047",
            iconBg: "rgba(67, 160, 71, 0.1)",
          };
        default:
          return {
            icon: <AnalyticsIcon sx={{ fontSize: 40, color: "#666" }} />,
            bgColor: "linear-gradient(135deg, #F5F5F5 0%, #EEEEEE 100%)",
            borderColor: "#666",
            textColor: "#666",
            iconBg: "rgba(102, 102, 102, 0.1)",
          };
      }
    };

    const { title, value } = props;
    const style = getCardStyle(title);

    return (
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card
          sx={{
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            background: style.bgColor,
            border: `1px solid ${style.borderColor}20`,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              transform: "translateY(-8px)",
              boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
              borderColor: style.borderColor,
            },
            height: "100%",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: `linear-gradient(90deg, ${style.borderColor}, ${style.borderColor}80)`,
            },
          }}
        >
          <CardContent
            sx={{
              p: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              flex: 1,
              position: "relative",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
                width: 80,
                height: 80,
                borderRadius: "50%",
                backgroundColor: style.iconBg,
                border: `2px solid ${style.borderColor}30`,
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "scale(1.1)",
                  backgroundColor: style.borderColor,
                  "& .MuiSvgIcon-root": {
                    color: "white",
                  },
                },
              }}
            >
              {style.icon}
            </Box>
            <Typography
              variant="h3"
              fontWeight="800"
              sx={{
                color: style.textColor,
                mb: 1,
                background: `linear-gradient(135deg, ${style.textColor}, ${style.textColor}80)`,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              {value?.toLocaleString() || 0}
            </Typography>
            <Typography
              variant="h6"
              fontWeight="600"
              sx={{
                color: style.textColor,
                opacity: 0.8,
                fontSize: "0.9rem",
                lineHeight: 1.2,
              }}
            >
              {title}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    );
  };

  const renderOverview = () => (
    <Box>
      {/* Overview Header with Help Button */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Typography variant="h5" fontWeight="bold" color="text.primary">
          MK Consultancy Dashboard
        </Typography>
        <IconButton
          onClick={() => setOverviewHelpOpen(true)}
          color="primary"
          sx={{
            backgroundColor: "rgba(184, 92, 56, 0.1)",
            "&:hover": {
              backgroundColor: "rgba(184, 92, 56, 0.2)",
            },
          }}
          title="Click to understand the data shown here"
        >
          <HelpIcon />
        </IconButton>
      </Box>

      {/* Loading State for Overview */}
      {loading && !dataLoaded && (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="200px"
          mb={3}
        >
          <Box textAlign="center">
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Loading overview data...
            </Typography>
          </Box>
        </Box>
      )}

      {/* Data Content */}
      {(dataLoaded || dashboardStats) && (
        <>
          {/* Key Metrics Cards (from dashboard stats - excludes marketplace) */}
          <Grid container spacing={3}>
            <CardItem
              title="Admin Users"
              value={dashboardStats?.totalAdmins ?? analyticsData.overview?.totalUsers ?? 0}
            />
            <CardItem
              title="Active Admins"
              value={dashboardStats?.activeAdmins ?? analyticsData.overview?.activeUsers ?? 0}
            />
            <CardItem
              title="Documents"
              value={dashboardStats?.totalDocuments ?? analyticsData.overview?.totalDocuments ?? 0}
            />
            <CardItem
              title="Audit Logs"
              value={dashboardStats?.totalAuditLogs ?? 0}
            />
            <CardItem
              title="Reviews"
              value={dashboardStats?.totalReviews ?? analyticsData.overview?.totalReviews ?? 0}
            />
            <CardItem
              title="Blogs"
              value={dashboardStats?.totalBlogs ?? analyticsData.overview?.totalBlogs ?? 0}
            />
            <CardItem
              title="Members"
              value={dashboardStats?.totalMembers ?? analyticsData.overview?.totalMembers ?? 0}
            />
            <CardItem
              title="Services"
              value={dashboardStats?.totalServices ?? 0}
            />
            <CardItem
              title="Projects"
              value={dashboardStats?.totalProjects ?? 0}
            />
            <CardItem
              title="FAQs"
              value={dashboardStats?.totalFaqs ?? 0}
            />
            <CardItem
              title="Contacts"
              value={dashboardStats?.totalContacts ?? 0}
            />
            <CardItem
              title="Quote Requests"
              value={dashboardStats?.totalQuoteRequests ?? 0}
            />
            <CardItem
              title="Consultations"
              value={dashboardStats?.totalConsultations ?? 0}
            />
            <CardItem
              title="Newsletter Subscribers"
              value={dashboardStats?.totalNewsletterSubscribers ?? 0}
            />
            <CardItem
              title="Interest Gallery"
              value={dashboardStats?.totalInterestGallery ?? 0}
            />
            <CardItem
              title="Forms"
              value={dashboardStats?.totalForms ?? analyticsData.overview?.totalForms ?? 0}
            />
            <CardItem
              title="Form Submissions"
              value={dashboardStats?.totalFormSubmissions ?? analyticsData.overview?.totalSubmissions ?? 0}
            />
          </Grid>

          {/* Quick Stats - 3 columns */}
          <Grid container spacing={3} sx={{ mt: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                    transform: "translateY(-2px)",
                  },
                  height: 280,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <CardContent
                  sx={{
                    p: 3,
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Typography variant="h6" gutterBottom fontWeight="600">
                    Review Metrics
                  </Typography>
                  <Stack spacing={2} sx={{ flex: 1 }}>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      p={2}
                      sx={{
                        backgroundColor: "rgba(255, 152, 0, 0.05)",
                        borderRadius: 2,
                        border: "1px solid rgba(255, 152, 0, 0.1)",
                      }}
                    >
                      <Typography fontWeight="500">Average Rating</Typography>
                      <Chip
                        label={analyticsData.reviews?.averageRating || "0.00"}
                        color="warning"
                      />
                    </Box>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      p={2}
                      sx={{
                        backgroundColor: "rgba(76, 175, 80, 0.05)",
                        borderRadius: 2,
                        border: "1px solid rgba(76, 175, 80, 0.1)",
                      }}
                    >
                      <Typography fontWeight="500">
                        Recent (30d)
                      </Typography>
                      <Chip
                        label={analyticsData.trends?.last30Days?.reviews || 0}
                        color="success"
                      />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                    transform: "translateY(-2px)",
                  },
                  height: 280,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <CardContent
                  sx={{
                    p: 3,
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Typography variant="h6" gutterBottom fontWeight="600">
                    Blog Metrics
                  </Typography>
                  <Stack spacing={2} sx={{ flex: 1 }}>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      p={2}
                      sx={{
                        backgroundColor: "rgba(184, 92, 56, 0.05)",
                        borderRadius: 2,
                        border: "1px solid rgba(25, 118, 210, 0.1)",
                      }}
                    >
                      <Typography fontWeight="500">
                        Total Views
                      </Typography>
                      <Chip
                        label={analyticsData.blogs?.totalViews || 0}
                        color="primary"
                      />
                    </Box>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      p={2}
                      sx={{
                        backgroundColor: "rgba(0, 188, 212, 0.05)",
                        borderRadius: 2,
                        border: "1px solid rgba(0, 188, 212, 0.1)",
                      }}
                    >
                      <Typography fontWeight="500">Total Likes</Typography>
                      <Chip
                        label={analyticsData.blogs?.totalLikes || 0}
                        color="info"
                      />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                    transform: "translateY(-2px)",
                  },
                  height: 280,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <CardContent
                  sx={{
                    p: 3,
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Typography variant="h6" gutterBottom fontWeight="600">
                    Recent Activity
                  </Typography>
                  <Stack spacing={2} sx={{ flex: 1 }}>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      p={2}
                      sx={{
                        backgroundColor: "rgba(184, 92, 56, 0.05)",
                        borderRadius: 2,
                        border: "1px solid rgba(25, 118, 210, 0.1)",
                      }}
                    >
                      <Typography fontWeight="500">Last 7 Days</Typography>
                      <Chip
                        label={analyticsData.auditTrail?.last7Days || 0}
                        color="primary"
                      />
                    </Box>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      p={2}
                      sx={{
                        backgroundColor: "rgba(255, 152, 0, 0.05)",
                        borderRadius: 2,
                        border: "1px solid rgba(255, 152, 0, 0.1)",
                      }}
                    >
                      <Typography fontWeight="500">Active Users</Typography>
                      <Chip
                        label={analyticsData.overview?.activeUsers || 0}
                        color="warning"
                      />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Additional Analytics Charts */}
          <Grid container spacing={3} sx={{ mt: 3 }}>
            {/* Documents by Type */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ p: 3, height: 400 }}>
                <Typography variant="h6" gutterBottom fontWeight="600">
                  Documents by Type
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  {(analyticsData.documents?.byType || []).length > 0 ? (
                    <BarChart
                      data={(analyticsData.documents?.byType || []).map(
                        (item) => ({
                          name: item.file_type.replace(/\b\w/g, l => l.toUpperCase()),
                          count: parseInt(item.count) || 0,
                        })
                      )}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip formatter={(value) => [value, "Documents"]} />
                      <Bar dataKey="count" fill="#B85C38" />
                    </BarChart>
                  ) : (
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      height="100%"
                    >
                      <Typography variant="body2" color="text.secondary">
                        No document data available
                      </Typography>
                    </Box>
                  )}
                </ResponsiveContainer>
              </Card>
            </Grid>

            {/* Users by Role */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ p: 3, height: 400 }}>
                <Typography variant="h6" gutterBottom fontWeight="600">
                  Users by Role
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  {(analyticsData.adminUsers?.byRole || []).length > 0 ? (
                    <BarChart
                      data={(analyticsData.adminUsers?.byRole || []).map(
                        (item) => ({
                          name: item.role.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                          count: parseInt(item.count) || 0,
                        })
                      )}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip formatter={(value) => [value, "Users"]} />
                      <Bar dataKey="count" fill="#B85C38" />
                    </BarChart>
                  ) : (
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      height="100%"
                    >
                      <Typography variant="body2" color="text.secondary">
                        No user role data available
                      </Typography>
                    </Box>
                  )}
                </ResponsiveContainer>
              </Card>
            </Grid>

            {/* Activity by Action - Full Width */}
            <Grid size={{ xs: 12 }}>
              <Card sx={{ p: 3, height: 400 }}>
                <Typography variant="h6" gutterBottom fontWeight="600">
                  Activity by Action (Last 7 Days)
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  {(analyticsData.auditTrail?.byAction || []).length > 0 ? (
                    <BarChart
                      data={(analyticsData.auditTrail?.byAction || []).map(
                        (item) => ({
                          name: item.action.replace('_', ' ').toUpperCase(),
                          count: parseInt(item.count) || 0,
                        })
                      )}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [value, "Actions"]} />
                      <Bar dataKey="count" fill="#f5576c" />
                    </BarChart>
                  ) : (
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      height="100%"
                    >
                      <Typography variant="body2" color="text.secondary">
                        No activity data available
                      </Typography>
                    </Box>
                  )}
                </ResponsiveContainer>
              </Card>
            </Grid>

            {/* Trends Summary */}
            <Grid size={{ xs: 12 }}>
              <Card 
                sx={{ 
                  p: 3,
                  border: '1px solid #e0e0e0',
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  fontWeight="600"
                  sx={{ mb: 3, color: '#333' }}
                >
                  30-Day Trends Summary
                </Typography>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    flexWrap: 'nowrap',
                    justifyContent: 'space-between',
                    overflow: 'hidden'
                  }}
                >
                  <Card
                    sx={{
                      flex: '1',
                      minWidth: 0,
                      p: 3,
                      textAlign: "center",
                      background: 'linear-gradient(135deg, #f5f5f5 0%, #e8f5e8 100%)',
                      border: 'none',
                      borderRadius: 3,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      transition: 'transform 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }
                    }}
                  >
                    <Typography 
                      variant="h3" 
                      fontWeight="bold"
                      sx={{ 
                        color: '#2e7d32',
                        mb: 1,
                        fontSize: '2.5rem'
                      }}
                    >
                      {analyticsData.trends?.last30Days?.reviews || 0}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#666',
                        fontWeight: 500,
                        fontSize: '0.875rem'
                      }}
                    >
                      New Reviews
                    </Typography>
                  </Card>
                  
                  <Card
                    sx={{
                      flex: '1',
                      minWidth: 0,
                      p: 3,
                      textAlign: "center",
                      background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                      border: 'none',
                      borderRadius: 3,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      transition: 'transform 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }
                    }}
                  >
                    <Typography 
                      variant="h3" 
                      fontWeight="bold"
                      sx={{ 
                        color: '#B85C38',
                        mb: 1,
                        fontSize: '2.5rem'
                      }}
                    >
                      {analyticsData.trends?.last30Days?.blogs || 0}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#666',
                        fontWeight: 500,
                        fontSize: '0.875rem'
                      }}
                    >
                      New Blogs
                    </Typography>
                  </Card>
                  
                  <Card
                    sx={{
                      flex: '1',
                      minWidth: 0,
                      p: 3,
                      textAlign: "center",
                      background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
                      border: 'none',
                      borderRadius: 3,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      transition: 'transform 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }
                    }}
                  >
                    <Typography 
                      variant="h3" 
                      fontWeight="bold"
                      sx={{ 
                        color: '#7b1fa2',
                        mb: 1,
                        fontSize: '2.5rem'
                      }}
                    >
                      {analyticsData.trends?.last30Days?.members || 0}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#666',
                        fontWeight: 500,
                        fontSize: '0.875rem'
                      }}
                    >
                      New Agent Applications
                    </Typography>
                  </Card>
                  
                  <Card
                    sx={{
                      flex: '1',
                      minWidth: 0,
                      p: 3,
                      textAlign: "center",
                      background: 'linear-gradient(135deg, #e1f5fe 0%, #b3e5fc 100%)',
                      border: 'none',
                      borderRadius: 3,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      transition: 'transform 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }
                    }}
                  >
                    <Typography 
                      variant="h3" 
                      fontWeight="bold"
                      sx={{ 
                        color: '#0288d1',
                        mb: 1,
                        fontSize: '2.5rem'
                      }}
                    >
                      {analyticsData.trends?.last30Days?.galleryItems || 0}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#666',
                        fontWeight: 500,
                        fontSize: '0.875rem'
                      }}
                    >
                      New Gallery Items
                    </Typography>
                  </Card>
                  
                  <Card
                    sx={{
                      flex: '1',
                      minWidth: 0,
                      p: 3,
                      textAlign: "center",
                      background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
                      border: 'none',
                      borderRadius: 3,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      transition: 'transform 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }
                    }}
                  >
                    <Typography 
                      variant="h3" 
                      fontWeight="bold"
                      sx={{ 
                        color: '#ef6c00',
                        mb: 1,
                        fontSize: '2.5rem'
                      }}
                    >
                      {analyticsData.trends?.last30Days?.submissions || 0}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#666',
                        fontWeight: 500,
                        fontSize: '0.875rem'
                      }}
                    >
                      New Form Submissions
                    </Typography>
                  </Card>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {/* Fallback when data is not loaded */}
      {!dataLoaded && !loading && (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="200px"
          mb={3}
        >
          <Box textAlign="center">
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              No data available
            </Typography>
            <Button
              variant="contained"
              onClick={fetchAnalyticsData}
              startIcon={<RefreshIcon />}
            >
              Load Data
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );

  const renderProjects = () => (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight="600" color="text.primary">
            Project Status & Distribution
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Project status breakdown and construction type distribution
          </Typography>
        </Box>
        <IconButton
          onClick={() => setProjectsHelpOpen(true)}
          color="primary"
          sx={{
            backgroundColor: "rgba(184, 92, 56, 0.1)",
            "&:hover": {
              backgroundColor: "rgba(184, 92, 56, 0.2)",
            },
          }}
          title="Click to understand the data shown here"
        >
          <HelpIcon />
        </IconButton>
      </Box>

      {/* Loading State for Projects */}
      {loading && !dataLoaded && (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="200px"
          mb={3}
        >
          <Box textAlign="center">
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Loading project data...
            </Typography>
          </Box>
        </Box>
      )}

      {/* Data Content */}
      {dataLoaded && (
        <>
          {/* Project Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                sx={{
                  p: 3,
                  textAlign: "center",
                  background: 'linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)',
                  color: 'white',
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(107, 78, 61, 0.3)',
                }}
              >
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                  {analyticsData.projects?.total || 0}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Total Projects
                </Typography>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                sx={{
                  p: 3,
                  textAlign: "center",
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white',
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(240, 147, 251, 0.3)',
                }}
              >
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                  {analyticsData.projects?.progress?.average || 0}%
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Average Progress
                </Typography>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                sx={{
                  p: 3,
                  textAlign: "center",
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  color: 'white',
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(79, 172, 254, 0.3)',
                }}
              >
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                  {analyticsData.projects?.completionRate || "0%"}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Completion Rate
                </Typography>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                sx={{
                  p: 3,
                  textAlign: "center",
                  background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                  color: 'white',
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(67, 233, 123, 0.3)',
                }}
              >
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                  {analyticsData.projects?.completedProjects || 0}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Completed Projects
                </Typography>
              </Card>
            </Grid>
          </Grid>

          {/* Progress Details */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ p: 3, height: 200 }}>
                <Typography variant="h6" gutterBottom fontWeight="600">
                  Progress Statistics
                </Typography>
                <Stack spacing={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Minimum Progress
                    </Typography>
                    <Chip 
                      label={`${analyticsData.projects?.progress?.minimum || 0}%`} 
                      color="info" 
                    />
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Maximum Progress
                    </Typography>
                    <Chip 
                      label={`${analyticsData.projects?.progress?.maximum || 0}%`} 
                      color="success" 
                    />
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Average Progress
                    </Typography>
                    <Chip 
                      label={`${analyticsData.projects?.progress?.average || 0}%`} 
                      color="primary" 
                    />
                  </Box>
                </Stack>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ p: 3, height: 200 }}>
                <Typography variant="h6" gutterBottom fontWeight="600">
                  Project Status Summary
                </Typography>
                <Stack spacing={2}>
                  {(analyticsData.projects?.byStatus || []).map((status, index) => (
                    <Box key={index} display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                        {status.status.replace('_', ' ')}
                      </Typography>
                      <Chip 
                        label={status.count} 
                        color={
                          status.status === 'completed' ? 'success' :
                          status.status === 'in_progress' ? 'primary' :
                          status.status === 'pending' ? 'warning' : 'default'
                        } 
                      />
                    </Box>
                  ))}
                </Stack>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ p: 3, height: 200 }}>
                <Typography variant="h6" gutterBottom fontWeight="600">
                  County Distribution
                </Typography>
                <Stack spacing={2}>
                  {(analyticsData.projects?.byCounty || []).map((county, index) => (
                    <Box key={index} display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        {county.county}
                      </Typography>
                      <Chip 
                        label={county.count} 
                        color="secondary" 
                      />
                    </Box>
                  ))}
                </Stack>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            {/* Project Status Chart */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ p: 3, height: 400 }}>
                <Typography variant="h6" gutterBottom fontWeight="600">
                  Project Status Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  {(analyticsData.projects?.byStatus || []).length > 0 ? (
                    <PieChart>
                      <Pie
                        data={(analyticsData.projects?.byStatus || []).map(
                          (item) => ({
                            name: item.status,
                            value: parseInt(item.count) || 0,
                          })
                        )}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius="90%"
                        innerRadius="50%"
                        fill="#8884d8"
                      >
                        {(analyticsData.projects?.byStatus || []).map(
                          (entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          )
                        )}
                      </Pie>
                      <Tooltip formatter={(value) => [value, "Projects"]} />
                      <Legend />
                    </PieChart>
                  ) : (
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      height="100%"
                    >
                      <Typography variant="body2" color="text.secondary">
                        No project data available
                      </Typography>
                    </Box>
                  )}
                </ResponsiveContainer>
              </Card>
            </Grid>

            {/* Project Category Chart */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ p: 3, height: 400 }}>
                <Typography variant="h6" gutterBottom fontWeight="600">
                  Project Category Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={(analyticsData.projects?.byCategory || []).map(
                      (item) => ({
                        ...item,
                        name: item.category,
                        count: parseInt(item.count) || 0,
                      })
                    )}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [value, "Projects"]} />
                    <Bar dataKey="count" fill="#f093fb" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Grid>

            {/* Project by County Chart */}
            <Grid size={{ xs: 12 }}>
              <Card sx={{ p: 3, height: 400 }}>
                <Typography variant="h6" gutterBottom fontWeight="600">
                  Projects by County
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  {(analyticsData.projects?.byCounty || []).length > 0 ? (
                    <BarChart
                      data={(analyticsData.projects?.byCounty || []).map(
                        (item) => ({
                          ...item,
                          name: item.county,
                          count: parseInt(item.count) || 0,
                        })
                      )}
                      margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        tick={{ fontSize: 12 }}
                        stroke="#666"
                      />
                      <YAxis tick={{ fontSize: 12 }} stroke="#666" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          border: "1px solid #ccc",
                          borderRadius: "8px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        }}
                        formatter={(value) => [value, "Projects"]}
                      />
                      <Legend />
                      <Bar
                        dataKey="count"
                        fill="#B85C38"
                        name="Total Projects"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  ) : (
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      height="100%"
                    >
                      <Typography variant="body2" color="text.secondary">
                        No county data available
                      </Typography>
                    </Box>
                  )}
                </ResponsiveContainer>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {/* Fallback when data is not loaded */}
      {!dataLoaded && !loading && (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="200px"
          mb={3}
        >
          <Box textAlign="center">
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              No project data available
            </Typography>
            <Button
              variant="contained"
              onClick={fetchAnalyticsData}
              startIcon={<RefreshIcon />}
            >
              Load Data
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );

  // Custom Bar Chart Component (similar to Home component)
  const CustomBarChart = ({ data, title, height = 400 }) => {
    return (
      <Box height={height} width="100%">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <YAxis tick={{ fontSize: 12 }} stroke="#666" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              />
              <Legend wrapperStyle={{ paddingTop: "20px" }} />
              <Bar
                dataKey="voterRegistrationRate"
                fill="#667eea"
                name="Registration Rate (%)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="supporterDensity"
                fill="#f093fb"
                name="Supporter Density (%)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Box
            height="100%"
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexDirection="column"
          >
            <Typography variant="body2" color="text.secondary">
              No performance data available
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  const renderTasksLabor = () => (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight="600" color="text.primary">
            Tasks & Labor Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Task status distribution and labor workforce analysis
          </Typography>
        </Box>
        <IconButton
          onClick={() => setTasksLaborHelpOpen(true)}
          color="primary"
          sx={{
            backgroundColor: "rgba(184, 92, 56, 0.1)",
            "&:hover": {
              backgroundColor: "rgba(184, 92, 56, 0.2)",
            },
          }}
          title="Click to understand the data shown here"
        >
          <HelpIcon />
        </IconButton>
      </Box>

      <Grid container spacing={3}>
        {/* Task Status Chart - Full Width */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom fontWeight="600">
              Task Status Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={(analyticsData.tasks?.byStatus || []).map((item) => ({
                  ...item,
                  count: parseInt(item.count) || 0,
                }))}
                margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="status"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: 12 }}
                  stroke="#666"
                />
                <YAxis tick={{ fontSize: 12 }} stroke="#666" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                  formatter={(value) => [value, "Tasks"]}
                />
                <Legend />
                <Bar
                  dataKey="count"
                  fill="#667eea"
                  name="Tasks"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Labor Type Chart - Full Width Bar Chart */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom fontWeight="600">
              Labor by Worker Type
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={(analyticsData.labor?.byType || []).map((item) => ({
                  name: item.worker_type
                    .replace("_", " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase()),
                  count: parseInt(item.count) || 0,
                }))}
                margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: 12 }}
                  stroke="#666"
                />
                <YAxis tick={{ fontSize: 12 }} stroke="#666" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                  formatter={(value) => [value, "Workers"]}
                />
                <Legend />
                <Bar
                  dataKey="count"
                  fill="#f093fb"
                  name="Workers"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Labor Summary */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="600">
              Labor Summary
            </Typography>
            <Stack spacing={2}>
              <Box display="flex" justifyContent="space-between">
                <Typography>Total Hours:</Typography>
                <Typography fontWeight="bold">
                  {analyticsData.labor?.summary?.totalHours || 0}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography>Total Cost:</Typography>
                <Typography fontWeight="bold">
                  KSh{" "}
                  {parseFloat(
                    analyticsData.labor?.summary?.totalCost || 0
                  ).toLocaleString()}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography>Avg Hourly Rate:</Typography>
                <Typography fontWeight="bold">
                  KSh {analyticsData.labor?.summary?.avgHourlyRate || 0}
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>

        {/* Recent Tasks */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="600">
              Recent Tasks
            </Typography>
            <List>
              {(analyticsData.tasks?.recent || []).map((task) => (
                <ListItem key={task.id}>
                  <ListItemIcon>
                    <BarChartIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={task.name}
                    secondary={`Project: ${
                      task.project?.name || "N/A"
                    } | Progress: ${task.progress_percent}%`}
                  />
                  <Chip
                    label={task.status}
                    color={task.status === "completed" ? "success" : "primary"}
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  // Custom Pie Chart Component (similar to Home component)
  const CustomPieChart = ({ data, title, height = 300 }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    const onPieEnter = (_, index) => {
      setActiveIndex(index);
    };

    const renderActiveShape = (props) => {
      const RADIAN = Math.PI / 180;
      const {
        cx,
        cy,
        midAngle,
        innerRadius,
        outerRadius,
        startAngle,
        endAngle,
        fill,
        payload,
        percent,
        value,
      } = props;
      const sin = Math.sin(-RADIAN * midAngle);
      const cos = Math.cos(-RADIAN * midAngle);
      const sx = cx + (outerRadius + 2) * cos;
      const sy = cy + (outerRadius + 2) * sin;
      const mx = cx + (outerRadius + 2) * cos;
      const my = cy + (outerRadius + 2) * sin;
      const ex = mx + (cos >= 0 ? 1 : -1) * 22;
      const ey = my;
      const textAnchor = cos >= 0 ? "start" : "end";

      return (
        <g>
          <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
            {payload.name}
          </text>
          <Sector
            cx={cx}
            cy={cy}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            startAngle={startAngle}
            endAngle={endAngle}
            fill={fill}
          />
          <Sector
            cx={cx}
            cy={cy}
            startAngle={startAngle}
            endAngle={endAngle}
            innerRadius={outerRadius + 2}
            outerRadius={outerRadius + 6}
            fill={fill}
          />
          <path
            d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
            stroke={fill}
            fill="none"
          />
          <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
          <text
            x={ex + (cos >= 0 ? 1 : -1) * 4}
            y={ey}
            textAnchor={textAnchor}
            fill="#333"
            fontSize="small"
          >{`${value}`}</text>
          <text
            x={ex + (cos >= 0 ? 1 : -1) * 4}
            y={ey}
            dy={18}
            textAnchor={textAnchor}
            fill="#999"
            fontSize="small"
          >
            {`(${(percent * 100).toFixed(0)}%)`}
          </text>
        </g>
      );
    };

    return (
      <Box height={height} width="100%">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius="90%"
                innerRadius="50%"
                fill="#8884d8"
                onMouseEnter={onPieEnter}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <Box
            height="100%"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Typography variant="body2">No data available</Typography>
          </Box>
        )}
      </Box>
    );
  };

  const renderBudgetResources = () => (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight="600" color="text.primary">
            Budget & Resource Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Budget analysis and resource allocation across projects
          </Typography>
        </Box>
        <IconButton
          onClick={() => setBudgetResourcesHelpOpen(true)}
          color="primary"
          sx={{
            backgroundColor: "rgba(184, 92, 56, 0.1)",
            "&:hover": {
              backgroundColor: "rgba(184, 92, 56, 0.2)",
            },
          }}
          title="Click to understand the data shown here"
        >
          <HelpIcon />
        </IconButton>
      </Box>

      <Grid container spacing={3}>
        {/* Budget Overview */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom fontWeight="600">
              Budget Overview
            </Typography>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography>Total Budgeted:</Typography>
                <Typography variant="h6" color="primary">
                  KSh{" "}
                  {parseFloat(
                    analyticsData.budget?.totalBudgeted || 0
                  ).toLocaleString()}
                </Typography>
              </Box>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography>Total Actual:</Typography>
                <Typography variant="h6" color="secondary">
                  KSh{" "}
                  {parseFloat(
                    analyticsData.budget?.totalActual || 0
                  ).toLocaleString()}
                </Typography>
              </Box>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography>Variance:</Typography>
                <Typography
                  variant="h6"
                  color={
                    parseFloat(analyticsData.budget?.variance || 0) >= 0
                      ? "success.main"
                      : "error.main"
                  }
                >
                  KSh{" "}
                  {parseFloat(
                    analyticsData.budget?.variance || 0
                  ).toLocaleString()}
                </Typography>
              </Box>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography>Utilization:</Typography>
                <Typography variant="h6" color="info.main">
                  {analyticsData.budget?.utilizationPercent || 0}%
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>

        {/* Budget by Category */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom fontWeight="600">
              Budget by Category
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              {(analyticsData.budget?.byCategory || []).length > 0 ? (
                <PieChart>
                  <Pie
                    data={(analyticsData.budget?.byCategory || []).map(
                      (item) => ({
                        name: item.category,
                        value: parseFloat(item.totalAmount) || 0,
                      })
                    )}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius="90%"
                    innerRadius="50%"
                    fill="#8884d8"
                  >
                    {(analyticsData.budget?.byCategory || []).map(
                      (entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      )
                    )}
                  </Pie>
                  <Tooltip
                    formatter={(value) =>
                      `KSh ${parseFloat(value).toLocaleString()}`
                    }
                  />
                  <Legend />
                </PieChart>
              ) : (
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  height="100%"
                >
                  <Typography variant="body2" color="text.secondary">
                    No budget data available
                  </Typography>
                </Box>
              )}
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Project Resources */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="600">
              Project Resource Allocation
            </Typography>
            <List>
              {(analyticsData.projects?.resources || []).map((project) => (
                <ListItem key={project.project_id}>
                  <ListItemIcon>
                    <MapIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={project.project_name}
                    secondary={`Status: ${project.status} | Progress: ${project.progress_percent}%`}
                  />
                  <Box display="flex" gap={1}>
                    <Chip
                      label={`Materials: ${project.materialCount}`}
                      size="small"
                      color="primary"
                    />
                    <Chip
                      label={`Labor: ${project.laborCount}`}
                      size="small"
                      color="secondary"
                    />
                    <Chip
                      label={`Equipment: ${project.equipmentCount}`}
                      size="small"
                      color="success"
                    />
                  </Box>
                </ListItem>
              ))}
            </List>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderPerformance = () => (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight="600" color="text.primary">
            Performance Metrics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Task completion rates and project performance indicators
          </Typography>
        </Box>
        <IconButton
          onClick={() => setPerformanceHelpOpen(true)}
          color="primary"
          sx={{
            backgroundColor: "rgba(184, 92, 56, 0.1)",
            "&:hover": {
              backgroundColor: "rgba(184, 92, 56, 0.2)",
            },
          }}
          title="Click to understand the data shown here"
        >
          <HelpIcon />
        </IconButton>
      </Box>

      <Grid container spacing={3}>
        {/* Performance Overview */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3, height: 300 }}>
            <Typography variant="h6" gutterBottom fontWeight="600">
              Performance Overview
            </Typography>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography>Task Completion Rate:</Typography>
                <Typography variant="h5" color="primary">
                  {analyticsData.performance?.taskCompletionRate || 0}%
                </Typography>
              </Box>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography>Completed Tasks:</Typography>
                <Typography variant="h6" color="success.main">
                  {analyticsData.performance?.completedTasks || 0}
                </Typography>
              </Box>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography>In Progress Tasks:</Typography>
                <Typography variant="h6" color="warning.main">
                  {analyticsData.performance?.inProgressTasks || 0}
                </Typography>
              </Box>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography>Projects at Risk:</Typography>
                <Typography
                  variant="h6"
                  color={
                    analyticsData.performance?.projectsAtRisk > 0
                      ? "error.main"
                      : "success.main"
                  }
                >
                  {analyticsData.performance?.projectsAtRisk || 0}
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>

        {/* Material Utilization */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3, height: 300 }}>
            <Typography variant="h6" gutterBottom fontWeight="600">
              Material Utilization
            </Typography>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography>Total Required:</Typography>
                <Typography variant="h6" color="primary">
                  {parseFloat(
                    analyticsData.materials?.summary?.totalRequired || 0
                  ).toLocaleString()}
                </Typography>
              </Box>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography>Total Used:</Typography>
                <Typography variant="h6" color="secondary">
                  {parseFloat(
                    analyticsData.materials?.summary?.totalUsed || 0
                  ).toLocaleString()}
                </Typography>
              </Box>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography>Utilization:</Typography>
                <Typography variant="h6" color="info.main">
                  {analyticsData.materials?.summary?.utilizationPercent || 0}%
                </Typography>
              </Box>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography>Total Cost:</Typography>
                <Typography variant="h6" color="success.main">
                  KSh{" "}
                  {parseFloat(
                    analyticsData.materials?.summary?.totalCost || 0
                  ).toLocaleString()}
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>

        {/* Equipment Summary */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="600">
              Equipment & Cost Summary
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box textAlign="center" p={2}>
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    {analyticsData.overview?.totalEquipment || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Equipment
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box textAlign="center" p={2}>
                  <Typography
                    variant="h4"
                    color="success.main"
                    fontWeight="bold"
                  >
                    {analyticsData.equipmentSummary?.availableEquipment || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Available Equipment
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box textAlign="center" p={2}>
                  <Typography
                    variant="h4"
                    color="warning.main"
                    fontWeight="bold"
                  >
                    KSh{" "}
                    {parseFloat(
                      analyticsData.equipmentSummary?.totalDailyRentalCost || 0
                    ).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Daily Rental Cost
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box textAlign="center" p={2}>
                  <Typography variant="h4" color="info.main" fontWeight="bold">
                    {analyticsData.overview?.overdueTasks || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overdue Tasks
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderEquipmentMaterials = () => (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight="600" color="text.primary">
            Equipment & Materials Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Equipment availability, material utilization, and resource
            management
          </Typography>
        </Box>
        <IconButton
          onClick={() => setEquipmentMaterialsHelpOpen(true)}
          color="primary"
          sx={{
            backgroundColor: "rgba(184, 92, 56, 0.1)",
            "&:hover": {
              backgroundColor: "rgba(184, 92, 56, 0.2)",
            },
          }}
          title="Click to understand the data shown here"
        >
          <HelpIcon />
        </IconButton>
      </Box>

      <Grid container spacing={3}>
        {/* Equipment Availability */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom fontWeight="600">
              Equipment Availability
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              {(analyticsData.equipment?.byAvailability || []).length > 0 ? (
                <PieChart>
                  <Pie
                    data={(analyticsData.equipment?.byAvailability || []).map(
                      (item) => ({
                        name: item.availability ? "Available" : "Unavailable",
                        value: parseInt(item.count) || 0,
                      })
                    )}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius="90%"
                    innerRadius="50%"
                    fill="#8884d8"
                  >
                    {(analyticsData.equipment?.byAvailability || []).map(
                      (entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      )
                    )}
                  </Pie>
                  <Tooltip formatter={(value) => [value, "Equipment"]} />
                  <Legend />
                </PieChart>
              ) : (
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  height="100%"
                >
                  <Typography variant="body2" color="text.secondary">
                    No equipment data available
                  </Typography>
                </Box>
              )}
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Labor Status */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom fontWeight="600">
              Labor Status Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={(analyticsData.labor?.byStatus || []).map((item) => ({
                  ...item,
                  count: parseInt(item.count) || 0,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip formatter={(value) => [value, "Workers"]} />
                <Bar dataKey="count" fill="#f093fb" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Material Summary */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="600">
              Material Summary
            </Typography>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography>Total Required:</Typography>
                <Typography variant="h6" color="primary">
                  {parseFloat(
                    analyticsData.materials?.summary?.totalRequired || 0
                  ).toLocaleString()}
                </Typography>
              </Box>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography>Total Used:</Typography>
                <Typography variant="h6" color="secondary">
                  {parseFloat(
                    analyticsData.materials?.summary?.totalUsed || 0
                  ).toLocaleString()}
                </Typography>
              </Box>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography>Utilization:</Typography>
                <Typography variant="h6" color="info.main">
                  {analyticsData.materials?.summary?.utilizationPercent || 0}%
                </Typography>
              </Box>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography>Total Cost:</Typography>
                <Typography variant="h6" color="success.main">
                  KSh{" "}
                  {parseFloat(
                    analyticsData.materials?.summary?.totalCost || 0
                  ).toLocaleString()}
                </Typography>
              </Box>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography>Total Spent:</Typography>
                <Typography variant="h6" color="warning.main">
                  KSh{" "}
                  {parseFloat(
                    analyticsData.materials?.summary?.totalSpent || 0
                  ).toLocaleString()}
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>

        {/* Equipment Summary */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="600">
              Equipment Summary
            </Typography>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography>Available Equipment:</Typography>
                <Typography variant="h6" color="success.main">
                  {analyticsData.equipmentSummary?.availableEquipment || 0}
                </Typography>
              </Box>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography>Total Equipment:</Typography>
                <Typography variant="h6" color="primary">
                  {analyticsData.overview?.totalEquipment || 0}
                </Typography>
              </Box>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography>Daily Rental Cost:</Typography>
                <Typography variant="h6" color="warning.main">
                  KSh{" "}
                  {parseFloat(
                    analyticsData.equipmentSummary?.totalDailyRentalCost || 0
                  ).toLocaleString()}
                </Typography>
              </Box>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography>Equipment Utilization:</Typography>
                <Typography variant="h6" color="info.main">
                  {analyticsData.equipmentSummary?.availableEquipment > 0
                    ? Math.round(
                        (analyticsData.equipmentSummary?.availableEquipment /
                          analyticsData.overview?.totalEquipment) *
                          100
                      )
                    : 0}
                  %
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>

        {/* Issues Summary */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="600">
              Issues Summary
            </Typography>
            <Stack spacing={2}>
              {(analyticsData.issues?.byStatus || []).map((issue) => (
                <Box
                  key={issue.status}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  p={2}
                  sx={{
                    backgroundColor: "rgba(25, 118, 210, 0.05)",
                    borderRadius: 2,
                    border: "1px solid rgba(25, 118, 210, 0.1)",
                  }}
                >
                  <Typography fontWeight="500" textTransform="capitalize">
                    {issue.status.replace("_", " ")} Issues
                  </Typography>
                  <Chip
                    label={issue.count}
                    color={
                      issue.status === "resolved"
                        ? "success"
                        : issue.status === "open"
                        ? "error"
                        : "warning"
                    }
                  />
                </Box>
              ))}
            </Stack>
          </Card>
        </Grid>

        {/* Documents Summary */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="600">
              Documents & Activity
            </Typography>
            <Stack spacing={2}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                p={2}
                sx={{
                  backgroundColor: "rgba(76, 175, 80, 0.05)",
                  borderRadius: 2,
                  border: "1px solid rgba(76, 175, 80, 0.1)",
                }}
              >
                <Typography fontWeight="500">Total Documents:</Typography>
                <Chip
                  label={analyticsData.overview?.totalDocuments || 0}
                  color="success"
                />
              </Box>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                p={2}
                sx={{
                  backgroundColor: "rgba(255, 152, 0, 0.05)",
                  borderRadius: 2,
                  border: "1px solid rgba(255, 152, 0, 0.1)",
                }}
              >
                <Typography fontWeight="500">Progress Updates:</Typography>
                <Chip
                  label={
                    analyticsData.recentActivity?.progressUpdates?.length || 0
                  }
                  color="warning"
                />
              </Box>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                p={2}
                sx={{
                  backgroundColor: "rgba(156, 39, 176, 0.05)",
                  borderRadius: 2,
                  border: "1px solid rgba(156, 39, 176, 0.1)",
                }}
              >
                <Typography fontWeight="500">Overdue Tasks:</Typography>
                <Chip
                  label={analyticsData.overview?.overdueTasks || 0}
                  color="secondary"
                />
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  // Render function for Reviews tab
  const renderReviews = () => (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight="600" color="text.primary">Reviews Analytics</Typography>
          <Typography variant="body2" color="text.secondary">Review status and rating distribution</Typography>
        </Box>
        <IconButton onClick={() => setReviewsHelpOpen(true)} color="primary" sx={{ backgroundColor: "rgba(184, 92, 56, 0.1)", "&:hover": { backgroundColor: "rgba(184, 92, 56, 0.2)" } }} title="Click to understand the data shown here">
          <HelpIcon />
        </IconButton>
      </Box>
      {loading && !dataLoaded && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px" mb={3}>
          <Box textAlign="center">
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">Loading reviews data...</Typography>
          </Box>
        </Box>
      )}
      {dataLoaded && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ p: 3, textAlign: "center", background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)', color: 'white', borderRadius: 3, boxShadow: '0 4px 20px rgba(255, 152, 0, 0.3)' }}>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>{analyticsData.reviews?.total || 0}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Reviews</Typography>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ p: 3, textAlign: "center", background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)', color: 'white', borderRadius: 3, boxShadow: '0 4px 20px rgba(76, 175, 80, 0.3)' }}>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>{analyticsData.reviews?.averageRating || "0.00"}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Average Rating</Typography>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ p: 3, textAlign: "center", background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)', color: 'white', borderRadius: 3, boxShadow: '0 4px 20px rgba(33, 150, 243, 0.3)' }}>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>{analyticsData.trends?.last30Days?.reviews || 0}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Recent (30d)</Typography>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ p: 3, textAlign: "center", background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)', color: 'white', borderRadius: 3, boxShadow: '0 4px 20px rgba(156, 39, 176, 0.3)' }}>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>{analyticsData.reviews?.byStatus?.find(s => s.status === 'approved')?.count || 0}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Approved</Typography>
              </Card>
            </Grid>
          </Grid>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ p: 3, height: 400 }}>
                <Typography variant="h6" gutterBottom fontWeight="600">Review Status Distribution</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  {(analyticsData.reviews?.byStatus || []).length > 0 ? (
                    <PieChart>
                      <Pie data={(analyticsData.reviews?.byStatus || []).map(item => ({ name: item.status, value: parseInt(item.count) || 0 }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="90%" innerRadius="50%" fill="#8884d8">
                        {(analyticsData.reviews?.byStatus || []).map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, "Reviews"]} />
                      <Legend />
                    </PieChart>
                  ) : (
                    <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                      <Typography variant="body2" color="text.secondary">No review data available</Typography>
                    </Box>
                  )}
                </ResponsiveContainer>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ p: 3, height: 400 }}>
                <Typography variant="h6" gutterBottom fontWeight="600">Rating Distribution</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  {(analyticsData.reviews?.byRating || []).length > 0 ? (
                    <BarChart data={(analyticsData.reviews?.byRating || []).map(item => ({ name: `${item.rating} Stars`, count: parseInt(item.count) || 0 }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [value, "Reviews"]} />
                      <Bar dataKey="count" fill="#ff9800" />
                    </BarChart>
                  ) : (
                    <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                      <Typography variant="body2" color="text.secondary">No rating data available</Typography>
                    </Box>
                  )}
                </ResponsiveContainer>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
      {!dataLoaded && !loading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px" mb={3}>
          <Box textAlign="center">
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>No review data available</Typography>
            <Button variant="contained" onClick={fetchAnalyticsData} startIcon={<RefreshIcon />}>Load Data</Button>
          </Box>
        </Box>
      )}
    </Box>
  );

  // Render function for Blogs tab
  const renderBlogs = () => (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight="600" color="text.primary">Blogs Analytics</Typography>
          <Typography variant="body2" color="text.secondary">Blog status, categories, and engagement metrics</Typography>
        </Box>
        <IconButton onClick={() => setBlogsHelpOpen(true)} color="primary" sx={{ backgroundColor: "rgba(184, 92, 56, 0.1)", "&:hover": { backgroundColor: "rgba(184, 92, 56, 0.2)" } }} title="Click to understand the data shown here">
          <HelpIcon />
        </IconButton>
      </Box>
      {loading && !dataLoaded && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px" mb={3}>
          <Box textAlign="center">
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">Loading blogs data...</Typography>
          </Box>
        </Box>
      )}
      {dataLoaded && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ p: 3, textAlign: "center", background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', color: 'white', borderRadius: 3, boxShadow: '0 4px 20px rgba(25, 118, 210, 0.3)' }}>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>{analyticsData.blogs?.total || 0}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Blogs</Typography>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ p: 3, textAlign: "center", background: 'linear-gradient(135deg, #43a047 0%, #388e3c 100%)', color: 'white', borderRadius: 3, boxShadow: '0 4px 20px rgba(67, 160, 71, 0.3)' }}>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>{analyticsData.blogs?.featured || 0}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Featured</Typography>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ p: 3, textAlign: "center", background: 'linear-gradient(135deg, #e91e63 0%, #c2185b 100%)', color: 'white', borderRadius: 3, boxShadow: '0 4px 20px rgba(233, 30, 99, 0.3)' }}>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>{analyticsData.blogs?.totalViews || 0}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Views</Typography>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ p: 3, textAlign: "center", background: 'linear-gradient(135deg, #ff5722 0%, #e64a19 100%)', color: 'white', borderRadius: 3, boxShadow: '0 4px 20px rgba(255, 87, 34, 0.3)' }}>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>{analyticsData.blogs?.totalLikes || 0}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Likes</Typography>
              </Card>
            </Grid>
          </Grid>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ p: 3, height: 400 }}>
                <Typography variant="h6" gutterBottom fontWeight="600">Blog Status Distribution</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  {(analyticsData.blogs?.byStatus || []).length > 0 ? (
                    <PieChart>
                      <Pie data={(analyticsData.blogs?.byStatus || []).map(item => ({ name: item.status, value: parseInt(item.count) || 0 }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="90%" innerRadius="50%" fill="#8884d8">
                        {(analyticsData.blogs?.byStatus || []).map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, "Blogs"]} />
                      <Legend />
                    </PieChart>
                  ) : (
                    <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                      <Typography variant="body2" color="text.secondary">No blog status data available</Typography>
                    </Box>
                  )}
                </ResponsiveContainer>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ p: 3, height: 400 }}>
                <Typography variant="h6" gutterBottom fontWeight="600">Blog Category Distribution</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  {(analyticsData.blogs?.byCategory || []).length > 0 ? (
                    <BarChart data={(analyticsData.blogs?.byCategory || []).map(item => ({ name: item.category, count: parseInt(item.count) || 0 }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip formatter={(value) => [value, "Blogs"]} />
                      <Bar dataKey="count" fill="#1976d2" />
                    </BarChart>
                  ) : (
                    <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                      <Typography variant="body2" color="text.secondary">No category data available</Typography>
                    </Box>
                  )}
                </ResponsiveContainer>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
      {!dataLoaded && !loading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px" mb={3}>
          <Box textAlign="center">
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>No blog data available</Typography>
            <Button variant="contained" onClick={fetchAnalyticsData} startIcon={<RefreshIcon />}>Load Data</Button>
          </Box>
        </Box>
      )}
    </Box>
  );

  // Render function for Gallery tab
  const renderGallery = () => (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight="600" color="text.primary">Gallery Analytics</Typography>
          <Typography variant="body2" color="text.secondary">Gallery items by type and category</Typography>
        </Box>
        <IconButton onClick={() => setGalleryHelpOpen(true)} color="primary" sx={{ backgroundColor: "rgba(184, 92, 56, 0.1)", "&:hover": { backgroundColor: "rgba(184, 92, 56, 0.2)" } }} title="Click to understand the data shown here">
          <HelpIcon />
        </IconButton>
      </Box>
      {loading && !dataLoaded && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px" mb={3}>
          <Box textAlign="center">
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">Loading gallery data...</Typography>
          </Box>
        </Box>
      )}
      {dataLoaded && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ p: 3, textAlign: "center", background: 'linear-gradient(135deg, #7b1fa2 0%, #6a1b9a 100%)', color: 'white', borderRadius: 3, boxShadow: '0 4px 20px rgba(123, 31, 162, 0.3)' }}>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>{analyticsData.gallery?.total || 0}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Items</Typography>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ p: 3, textAlign: "center", background: 'linear-gradient(135deg, #43a047 0%, #388e3c 100%)', color: 'white', borderRadius: 3, boxShadow: '0 4px 20px rgba(67, 160, 71, 0.3)' }}>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>{analyticsData.gallery?.active || 0}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Active Items</Typography>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ p: 3, textAlign: "center", background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)', color: 'white', borderRadius: 3, boxShadow: '0 4px 20px rgba(255, 152, 0, 0.3)' }}>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>{analyticsData.gallery?.featured || 0}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Featured</Typography>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ p: 3, textAlign: "center", background: 'linear-gradient(135deg, #0288d1 0%, #0277bd 100%)', color: 'white', borderRadius: 3, boxShadow: '0 4px 20px rgba(2, 136, 209, 0.3)' }}>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>{analyticsData.trends?.last30Days?.galleryItems || 0}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Recent (30d)</Typography>
              </Card>
            </Grid>
          </Grid>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ p: 3, height: 400 }}>
                <Typography variant="h6" gutterBottom fontWeight="600">Gallery Items by Type</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  {(analyticsData.gallery?.byType || []).length > 0 ? (
                    <PieChart>
                      <Pie data={(analyticsData.gallery?.byType || []).map(item => ({ name: item.type, value: parseInt(item.count) || 0 }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="90%" innerRadius="50%" fill="#8884d8">
                        {(analyticsData.gallery?.byType || []).map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, "Items"]} />
                      <Legend />
                    </PieChart>
                  ) : (
                    <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                      <Typography variant="body2" color="text.secondary">No type data available</Typography>
                    </Box>
                  )}
                </ResponsiveContainer>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ p: 3, height: 400 }}>
                <Typography variant="h6" gutterBottom fontWeight="600">Gallery Items by Category</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  {(analyticsData.gallery?.byCategory || []).length > 0 ? (
                    <BarChart data={(analyticsData.gallery?.byCategory || []).map(item => ({ name: item.category || 'N/A', count: parseInt(item.count) || 0 }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip formatter={(value) => [value, "Items"]} />
                      <Bar dataKey="count" fill="#7b1fa2" />
                    </BarChart>
                  ) : (
                    <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                      <Typography variant="body2" color="text.secondary">No category data available</Typography>
                    </Box>
                  )}
                </ResponsiveContainer>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
      {!dataLoaded && !loading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px" mb={3}>
          <Box textAlign="center">
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>No gallery data available</Typography>
            <Button variant="contained" onClick={fetchAnalyticsData} startIcon={<RefreshIcon />}>Load Data</Button>
          </Box>
        </Box>
      )}
    </Box>
  );

  // Render function for Forms tab
  const renderForms = () => (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight="600" color="text.primary">Forms Analytics</Typography>
          <Typography variant="body2" color="text.secondary">Forms, fields, options, and submissions</Typography>
        </Box>
        <IconButton onClick={() => setFormsHelpOpen(true)} color="primary" sx={{ backgroundColor: "rgba(184, 92, 56, 0.1)", "&:hover": { backgroundColor: "rgba(184, 92, 56, 0.2)" } }} title="Click to understand the data shown here">
          <HelpIcon />
        </IconButton>
      </Box>
      {loading && !dataLoaded && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px" mb={3}>
          <Box textAlign="center">
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">Loading forms data...</Typography>
          </Box>
        </Box>
      )}
      {dataLoaded && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ p: 3, textAlign: "center", background: 'linear-gradient(135deg, #f57c00 0%, #e65100 100%)', color: 'white', borderRadius: 3, boxShadow: '0 4px 20px rgba(245, 124, 0, 0.3)' }}>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>{analyticsData.forms?.total || 0}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Forms</Typography>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ p: 3, textAlign: "center", background: 'linear-gradient(135deg, #43a047 0%, #388e3c 100%)', color: 'white', borderRadius: 3, boxShadow: '0 4px 20px rgba(67, 160, 71, 0.3)' }}>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>{analyticsData.formFields?.total || 0}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Form Fields</Typography>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ p: 3, textAlign: "center", background: 'linear-gradient(135deg, #0288d1 0%, #0277bd 100%)', color: 'white', borderRadius: 3, boxShadow: '0 4px 20px rgba(2, 136, 209, 0.3)' }}>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>{analyticsData.fieldOptions?.total || 0}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Field Options</Typography>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ p: 3, textAlign: "center", background: 'linear-gradient(135deg, #7b1fa2 0%, #6a1b9a 100%)', color: 'white', borderRadius: 3, boxShadow: '0 4px 20px rgba(123, 31, 162, 0.3)' }}>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>{analyticsData.formSubmissions?.total || 0}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Submissions</Typography>
              </Card>
            </Grid>
          </Grid>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ p: 3, height: 400 }}>
                <Typography variant="h6" gutterBottom fontWeight="600">Form Submission Status</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  {(analyticsData.formSubmissions?.byStatus || []).length > 0 ? (
                    <PieChart>
                      <Pie data={(analyticsData.formSubmissions?.byStatus || []).map(item => ({ name: item.status, value: parseInt(item.count) || 0 }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="90%" innerRadius="50%" fill="#8884d8">
                        {(analyticsData.formSubmissions?.byStatus || []).map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, "Submissions"]} />
                      <Legend />
                    </PieChart>
                  ) : (
                    <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                      <Typography variant="body2" color="text.secondary">No submission status data available</Typography>
                    </Box>
                  )}
                </ResponsiveContainer>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ p: 3, height: 400 }}>
                <Typography variant="h6" gutterBottom fontWeight="600">Forms Overview</Typography>
                <Box sx={{ p: 3, height: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" p={2} sx={{ backgroundColor: "rgba(245, 124, 0, 0.05)", borderRadius: 2, border: "1px solid rgba(245, 124, 0, 0.1)" }}>
                    <Typography fontWeight="500">Active Forms:</Typography>
                    <Chip label={analyticsData.forms?.active || 0} color="warning" />
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" p={2} sx={{ backgroundColor: "rgba(67, 160, 71, 0.05)", borderRadius: 2, border: "1px solid rgba(67, 160, 71, 0.1)" }}>
                    <Typography fontWeight="500">Recent Forms (30d):</Typography>
                    <Chip label={analyticsData.trends?.last30Days?.forms || 0} color="success" />
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" p={2} sx={{ backgroundColor: "rgba(2, 136, 209, 0.05)", borderRadius: 2, border: "1px solid rgba(2, 136, 209, 0.1)" }}>
                    <Typography fontWeight="500">Recent Submissions (30d):</Typography>
                    <Chip label={analyticsData.trends?.last30Days?.submissions || 0} color="info" />
                  </Box>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
      {!dataLoaded && !loading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px" mb={3}>
          <Box textAlign="center">
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>No forms data available</Typography>
            <Button variant="contained" onClick={fetchAnalyticsData} startIcon={<RefreshIcon />}>Load Data</Button>
          </Box>
        </Box>
      )}
    </Box>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return renderOverview();
      case 1:
        return renderReviews();
      case 2:
        return renderBlogs();
      case 3:
        return renderGallery();
      case 4:
        return renderForms();
      default:
        return renderOverview();
    }
  };
  
  // Inquiries tab render function
  const renderInquiries = () => (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight="600" color="text.primary">
            Inquiry Status & Distribution
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Inquiry status breakdown and category distribution
          </Typography>
        </Box>
        <IconButton
          onClick={() => setInquiriesHelpOpen(true)}
          color="primary"
          sx={{
            backgroundColor: "rgba(184, 92, 56, 0.1)",
            "&:hover": {
              backgroundColor: "rgba(184, 92, 56, 0.2)",
            },
          }}
          title="Click to understand the data shown here"
        >
          <HelpIcon />
        </IconButton>
      </Box>

      {/* Loading State */}
      {loading && !dataLoaded && (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="200px"
          mb={3}
        >
          <Box textAlign="center">
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Loading inquiry data...
            </Typography>
          </Box>
        </Box>
      )}

      {/* Data Content */}
      {dataLoaded && (
        <>
          <Grid container spacing={3}>
            {/* Summary Cards */}
            <Grid size={{ xs: 12, md: 3 }}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                    transform: "translateY(-2px)",
                  },
                  height: "100%",
                }}
              >
                <CardContent sx={{ p: 3, textAlign: "center" }}>
                  <InfoIcon sx={{ fontSize: 48, color: "#1976d2", mb: 2 }} />
                  <Typography variant="h3" fontWeight="bold" color="primary">
                    {analyticsData.inquiries?.total || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Total Inquiries
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                    transform: "translateY(-2px)",
                  },
                  height: "100%",
                }}
              >
                <CardContent sx={{ p: 3, textAlign: "center" }}>
                  <Timeline sx={{ fontSize: 48, color: "#f57c00", mb: 2 }} />
                  <Typography variant="h3" fontWeight="bold" color="warning.main">
                    {analyticsData.inquiries?.byStatus?.find(s => s.status === 'pending')?.count || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Pending Inquiries
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                    transform: "translateY(-2px)",
                  },
                  height: "100%",
                }}
              >
                <CardContent sx={{ p: 3, textAlign: "center" }}>
                  <TrendingUp sx={{ fontSize: 48, color: "#2e7d32", mb: 2 }} />
                  <Typography variant="h3" fontWeight="bold" color="success.main">
                    {analyticsData.inquiries?.byStatus?.find(s => s.status === 'resolved')?.count || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Resolved Inquiries
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                    transform: "translateY(-2px)",
                  },
                  height: "100%",
                }}
              >
                <CardContent sx={{ p: 3, textAlign: "center" }}>
                  <GaugeIcon sx={{ fontSize: 48, color: "#7b1fa2", mb: 2 }} />
                  <Typography variant="h3" fontWeight="bold" color="secondary.main">
                    {analyticsData.inquiries?.averageResolutionTimeHours || "0.00"}h
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Avg Resolution Time
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Inquiry Status Chart */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ p: 3, height: 400 }}>
                <Typography variant="h6" gutterBottom fontWeight="600">
                  Inquiry Status Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  {(analyticsData.inquiries?.byStatus || []).length > 0 ? (
                    <PieChart>
                      <Pie
                        data={(analyticsData.inquiries?.byStatus || []).map(
                          (item) => ({
                            name: item.status.replace('_', ' ').toUpperCase(),
                            value: parseInt(item.count) || 0,
                          })
                        )}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius="90%"
                        innerRadius="50%"
                        fill="#8884d8"
                      >
                        {(analyticsData.inquiries?.byStatus || []).map(
                          (entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          )
                        )}
                      </Pie>
                      <Tooltip formatter={(value) => [value, "Inquiries"]} />
                      <Legend />
                    </PieChart>
                  ) : (
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      height="100%"
                    >
                      <Typography variant="body2" color="text.secondary">
                        No inquiry data available
                      </Typography>
                    </Box>
                  )}
                </ResponsiveContainer>
              </Card>
            </Grid>

            {/* Inquiry Category Chart */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ p: 3, height: 400 }}>
                <Typography variant="h6" gutterBottom fontWeight="600">
                  Inquiry Category Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={(analyticsData.inquiries?.byCategory || []).map(
                      (item) => ({
                        ...item,
                        name: item.category.replace('_', ' ').toUpperCase(),
                        count: parseInt(item.count) || 0,
                      })
                    )}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip formatter={(value) => [value, "Inquiries"]} />
                    <Bar dataKey="count" fill="#B85C38" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Grid>

            {/* Category Breakdown Table */}
            <Grid size={{ xs: 12 }}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom fontWeight="600">
                  Category Breakdown
                </Typography>
                <Box sx={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ backgroundColor: "rgba(184, 92, 56, 0.05)" }}>
                        <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid rgba(184, 92, 56, 0.2)" }}>
                          Category
                        </th>
                        <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid rgba(184, 92, 56, 0.2)" }}>
                          Count
                        </th>
                        <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid rgba(184, 92, 56, 0.2)" }}>
                          Percentage
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(analyticsData.inquiries?.byCategory || []).map((item, index) => {
                        const total = analyticsData.inquiries?.total || 1;
                        const percentage = ((parseInt(item.count) / total) * 100).toFixed(1);
                        return (
                          <tr key={index} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                            <td style={{ padding: "12px", textTransform: "capitalize" }}>
                              {item.category.replace('_', ' ')}
                            </td>
                            <td style={{ padding: "12px", textAlign: "center", fontWeight: "bold" }}>
                              {item.count}
                            </td>
                            <td style={{ padding: "12px", textAlign: "center" }}>
                              <Chip 
                                label={`${percentage}%`} 
                                color="primary" 
                                size="small"
                                variant="outlined"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {/* Fallback when data is not loaded */}
      {!dataLoaded && !loading && (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="200px"
          mb={3}
        >
          <Box textAlign="center">
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              No inquiry data available
            </Typography>
            <Button
              variant="contained"
              onClick={fetchAnalyticsData}
              startIcon={<RefreshIcon />}
            >
              Load Data
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );

  // Show error message if there's an error
  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchAnalyticsData} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1.5 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          fontWeight: "bold",
          mb: 1.5,
          color: "#2c3e50",
          textAlign: "center",
          background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        MK Consultancy Dashboard
      </Typography>

      <Card
        sx={{
          borderRadius: 3,
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          border: "1px solid rgba(107, 78, 61, 0.1)",
          boxShadow: "0 8px 32px rgba(107, 78, 61, 0.1)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Box
          sx={{
            borderBottom: 1,
            borderColor: "rgba(107, 78, 61, 0.1)",
            backgroundColor: "rgba(245, 241, 232, 0.5)",
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
            sx={{
              "& .MuiTab-root": {
                color: "#6B4E3D",
                fontWeight: 600,
                minHeight: 60,
                fontSize: "0.875rem",
                padding: "8px 12px",
                "&.Mui-selected": {
                  color: "#B85C38",
                  backgroundColor: "rgba(184, 92, 56, 0.08)",
                },
                "&:hover": {
                  backgroundColor: "rgba(184, 92, 56, 0.05)",
                },
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "#B85C38",
                height: 3,
                borderRadius: "3px 3px 0 0",
              },
            }}
          >
            {tabs.map((tab) => (
              <Tab
                key={tab.value}
                label={tab.label}
                icon={tab.icon}
                iconPosition="start"
                sx={{ minHeight: 60 }}
              />
            ))}
          </Tabs>
        </Box>

        <Box sx={{ p: 1.5 }}>{renderTabContent()}</Box>
      </Card>

      {/* Help Dialogs */}
      <OverviewHelpDialog />
      <ReviewsHelpDialog />
      <BlogsHelpDialog />
      <GalleryHelpDialog />
      <FormsHelpDialog />
    </Box>
  );
};

export default Analytics;
