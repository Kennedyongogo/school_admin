import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  CircularProgress,
  Alert,
  IconButton,
  Checkbox,
  FormControlLabel,
  Divider,
  Chip,
  OutlinedInput,
} from "@mui/material";
import {
  Save,
  ArrowBack,
  CloudUpload,
  Image as ImageIcon,
  Close as CloseIcon,
  Article,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const BlogCreate = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [featuredFile, setFeaturedFile] = useState(null);
  const [featuredPreview, setFeaturedPreview] = useState(null);
  const [authorFile, setAuthorFile] = useState(null);
  const [authorPreview, setAuthorPreview] = useState(null);
  const [blogList, setBlogList] = useState([]);

  const [blogForm, setBlogForm] = useState({
    slug: "",
    title: "",
    excerpt: "",
    content: "",
    category: "",
    tags: "",
    featured: false,
    priority: 0,
    heroAltText: "",
    authorName: "",
    authorBio: "",
    readTime: "",
    publishDate: "",
    status: "draft",
    metaTitle: "",
    metaDescription: "",
    relatedPostIds: [],
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/blogs?limit=200", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) setBlogList(data.data);
      })
      .catch(() => setBlogList([]));
  }, []);

  const categoryOptions = ["Agri-Finance", "Agri-Tech", "Climate-Smart", "Livestock", "Regenerative", "Marketing", "Sustainable Tech", "Other"];

  const handleInputChange = (field, value) => {
    setBlogForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (event, type = "featured") => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      Swal.fire({
        icon: "error",
        title: "File too large",
        text: `${file.name} is larger than 10MB`,
      });
      return;
    }
    if (!file.type.startsWith("image/")) {
      Swal.fire({
        icon: "error",
        title: "Invalid file type",
        text: `${file.name} is not an image`,
      });
      return;
    }
    const reader = new FileReader();
    if (type === "author") {
      setAuthorFile(file);
      reader.onloadend = () => setAuthorPreview(reader.result);
    } else {
      setFeaturedFile(file);
      reader.onloadend = () => setFeaturedPreview(reader.result);
    }
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const removeFeaturedFile = () => {
    setFeaturedFile(null);
    setFeaturedPreview(null);
  };

  const removeAuthorFile = () => {
    setAuthorFile(null);
    setAuthorPreview(null);
  };

  const isFormValid = () =>
    blogForm.slug.trim() && blogForm.title.trim() && blogForm.content.trim();

  const handleCreate = async () => {
    try {
      setSaving(true);
      setError(null);

      const token = localStorage.getItem("token");
      const formData = new FormData();

      // map fields
      formData.append("slug", blogForm.slug);
      formData.append("title", blogForm.title);
      formData.append("excerpt", blogForm.excerpt);
      formData.append("content", blogForm.content);
      if (blogForm.category) formData.append("category", blogForm.category);
      if (blogForm.tags)
        formData.append(
          "tags",
          JSON.stringify(
            blogForm.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          )
        );
      formData.append("featured", blogForm.featured);
      formData.append("priority", blogForm.priority || 0);
      if (blogForm.heroAltText) formData.append("heroAltText", blogForm.heroAltText);
      if (blogForm.authorName) formData.append("authorName", blogForm.authorName);
      if (blogForm.authorBio) formData.append("authorBio", blogForm.authorBio);
      if (blogForm.readTime) formData.append("readTime", blogForm.readTime);
      if (blogForm.publishDate) formData.append("publishDate", blogForm.publishDate);
      if (blogForm.status) formData.append("status", blogForm.status);
      if (blogForm.metaTitle) formData.append("metaTitle", blogForm.metaTitle);
      if (blogForm.metaDescription) formData.append("metaDescription", blogForm.metaDescription);
      if (blogForm.relatedPostIds?.length) {
        formData.append("relatedPostIds", JSON.stringify(blogForm.relatedPostIds));
      }

      if (featuredFile) {
        formData.append("blog_image", featuredFile);
      }
      if (authorFile) {
        formData.append("author_image", authorFile);
      }

      const response = await fetch("/api/blogs", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setFeaturedFile(null);
        setFeaturedPreview(null);
        setAuthorFile(null);
        setAuthorPreview(null);
        await Swal.fire({
          title: "Success!",
          text: "Blog created successfully!",
          icon: "success",
          confirmButtonColor: "#667eea",
        });
        navigate("/blogs");
      } else {
        throw new Error(result.message || "Failed to create blog");
      }
    } catch (err) {
      console.error("Error creating blog:", err);
      setError(err.message || "Failed to create blog");
      await Swal.fire({
        title: "Error!",
        text: err.message || "Failed to create blog",
        icon: "error",
        confirmButtonColor: "#667eea",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, rgba(245, 241, 232, 0.95) 0%, rgba(255, 255, 255, 0.98) 50%, rgba(232, 224, 209, 0.95) 100%)",
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
            p: 3,
            color: "white",
            position: "relative",
            overflow: "hidden",
            borderRadius: 2,
            mb: 4,
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "50%",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: -30,
              left: -30,
              width: 150,
              height: 150,
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: "50%",
            }}
          />
          <Stack
            direction="row"
            alignItems="center"
            spacing={2}
            sx={{ position: "relative", zIndex: 1 }}
          >
            <IconButton
              onClick={() => navigate("/blogs")}
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                color: "white",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.3)",
                },
              }}
            >
              <ArrowBack />
            </IconButton>
            <Article sx={{ fontSize: 40 }} />
            <Typography
              variant="h3"
              sx={{
                fontWeight: "bold",
                textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
              }}
            >
              Create Blog
            </Typography>
          </Stack>

          {error && (
            <Alert
              severity="error"
              sx={{ mt: 2, position: "relative", zIndex: 1 }}
            >
              {error}
            </Alert>
          )}
        </Box>

        <Card
          sx={{
            backgroundColor: "white",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e0e0e0",
          }}
        >
          <CardContent>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Slug"
                value={blogForm.slug}
                onChange={(e) => handleInputChange("slug", e.target.value)}
                helperText="URL-friendly identifier (e.g., our-first-safari)"
              />
              <TextField
                fullWidth
                label="Title"
                value={blogForm.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
              />
              <TextField
                fullWidth
                label="Excerpt"
                multiline
                rows={2}
                value={blogForm.excerpt}
                onChange={(e) => handleInputChange("excerpt", e.target.value)}
              />
              <TextField
                fullWidth
                label="Content"
                multiline
                rows={6}
                value={blogForm.content}
                onChange={(e) => handleInputChange("content", e.target.value)}
              />
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={blogForm.category}
                  label="Category"
                  onChange={(e) => handleInputChange("category", e.target.value)}
                >
                  {categoryOptions.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Tags (comma separated)"
                value={blogForm.tags}
                onChange={(e) => handleInputChange("tags", e.target.value)}
              />
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.secondary" }}>
                Author
              </Typography>
              <TextField
                fullWidth
                label="Author Name"
                value={blogForm.authorName}
                onChange={(e) => handleInputChange("authorName", e.target.value)}
              />
              <TextField
                fullWidth
                label="Author Bio"
                multiline
                rows={2}
                value={blogForm.authorBio}
                onChange={(e) => handleInputChange("authorBio", e.target.value)}
              />
              <Box>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Author Image
                </Typography>
                <Box mb={2}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, "author")}
                    style={{ display: "none" }}
                    id="blog-author-upload"
                  />
                  <label htmlFor="blog-author-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<CloudUpload />}
                      sx={{
                        color: "#667eea",
                        borderColor: "#667eea",
                        "&:hover": {
                          borderColor: "#667eea",
                          backgroundColor: "rgba(102, 126, 234, 0.1)",
                        },
                        mb: 2,
                      }}
                    >
                      Upload Author Image
                    </Button>
                  </label>
                </Box>

                {authorPreview ? (
                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: "#f8f9fa",
                      borderRadius: 2,
                      border: "1px solid #e0e0e0",
                      position: "relative",
                      maxWidth: 300,
                    }}
                  >
                    <IconButton
                      onClick={removeAuthorFile}
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        color: "white",
                        "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.7)" },
                        zIndex: 2,
                      }}
                      size="small"
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                    <img
                      src={authorPreview}
                      alt="Author"
                      style={{
                        width: "120px",
                        height: "120px",
                        objectFit: "cover",
                        borderRadius: "50%",
                        marginBottom: "8px",
                      }}
                    />
                    <Typography variant="caption" sx={{ color: "#333" }}>
                      {authorFile?.name}
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      border: "2px dashed #ccc",
                      borderRadius: 2,
                      p: 3,
                      textAlign: "center",
                      bgcolor: "#f9f9f9",
                      maxWidth: 300,
                    }}
                  >
                    <ImageIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                    <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
                      No author image. Click "Upload Author Image" to add one.
                    </Typography>
                  </Box>
                )}
              </Box>
              <TextField
                fullWidth
                label="Read Time (minutes)"
                type="number"
                value={blogForm.readTime}
                onChange={(e) => handleInputChange("readTime", e.target.value)}
              />
              <TextField
                fullWidth
                label="Priority"
                type="number"
                value={blogForm.priority}
                onChange={(e) => handleInputChange("priority", e.target.value)}
                helperText="Higher shows first when featured"
              />
              <TextField
                fullWidth
                label="Publish Date"
                type="date"
                value={blogForm.publishDate}
                onChange={(e) => handleInputChange("publishDate", e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={blogForm.status}
                  label="Status"
                  onChange={(e) => handleInputChange("status", e.target.value)}
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={blogForm.featured}
                    onChange={(e) =>
                      handleInputChange("featured", e.target.checked)
                    }
                  />
                }
                label="Featured"
              />
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.secondary" }}>
                Featured Image
              </Typography>
              <TextField
                fullWidth
                label="Hero / Featured Image Alt Text"
                value={blogForm.heroAltText}
                onChange={(e) => handleInputChange("heroAltText", e.target.value)}
                helperText="Accessibility and SEO"
              />
              <Box>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Featured Image File
                </Typography>
                <Box mb={2}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                    id="blog-featured-upload"
                  />
                  <label htmlFor="blog-featured-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<CloudUpload />}
                      sx={{
                        color: "#667eea",
                        borderColor: "#667eea",
                        "&:hover": {
                          borderColor: "#667eea",
                          backgroundColor: "rgba(102, 126, 234, 0.1)",
                        },
                        mb: 2,
                      }}
                    >
                      Upload Image
                    </Button>
                  </label>
                </Box>

                {featuredPreview ? (
                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: "#f8f9fa",
                      borderRadius: 2,
                      border: "1px solid #e0e0e0",
                      position: "relative",
                      maxWidth: 400,
                    }}
                  >
                    <IconButton
                      onClick={removeFeaturedFile}
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        color: "white",
                        "&:hover": {
                          backgroundColor: "rgba(0, 0, 0, 0.7)",
                        },
                        zIndex: 2,
                      }}
                      size="small"
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                    <img
                      src={featuredPreview}
                      alt="Featured"
                      style={{
                        width: "100%",
                        height: "200px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        marginBottom: "8px",
                      }}
                    />
                    <Typography variant="caption" sx={{ color: "#333" }}>
                      {featuredFile?.name}
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      border: "2px dashed #ccc",
                      borderRadius: 2,
                      p: 3,
                      textAlign: "center",
                      bgcolor: "#f9f9f9",
                      maxWidth: 400,
                    }}
                  >
                    <ImageIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                    <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
                      No image selected. Click "Upload Image" to add one.
                    </Typography>
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.secondary" }}>
                SEO & Meta
              </Typography>
              <TextField
                fullWidth
                label="Meta Title"
                value={blogForm.metaTitle}
                onChange={(e) => handleInputChange("metaTitle", e.target.value)}
                helperText="Browser tab / search result title"
              />
              <TextField
                fullWidth
                label="Meta Description"
                multiline
                rows={2}
                value={blogForm.metaDescription}
                onChange={(e) => handleInputChange("metaDescription", e.target.value)}
                helperText="Search result snippet"
              />

              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.secondary" }}>
                Related posts
              </Typography>
              <FormControl fullWidth>
                <InputLabel id="related-posts-label">Related posts</InputLabel>
                <Select
                  labelId="related-posts-label"
                  multiple
                  value={blogForm.relatedPostIds}
                  onChange={(e) => handleInputChange("relatedPostIds", e.target.value)}
                  input={<OutlinedInput label="Related posts" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((id) => {
                        const blog = blogList.find((b) => b.id === id);
                        return (
                          <Chip
                            key={id}
                            label={blog ? blog.title : id}
                            size="small"
                            onDelete={() =>
                              handleInputChange(
                                "relatedPostIds",
                                blogForm.relatedPostIds.filter((x) => x !== id)
                              )
                            }
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {blogList.map((blog) => (
                    <MenuItem key={blog.id} value={blog.id}>
                      {blog.title}
                    </MenuItem>
                  ))}
                  {blogList.length === 0 && (
                    <MenuItem disabled>No other blogs yet</MenuItem>
                  )}
                </Select>
              </FormControl>

              <Box display="flex" gap={2}>
              <Button
                variant="contained"
                size="large"
                startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                onClick={handleCreate}
                disabled={!isFormValid() || saving}
                sx={{
                  flex: 1,
                  background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
                  color: "white",
                  "&:hover": {
                    background: "linear-gradient(135deg, #8B4225 0%, #6B4E3D 100%)",
                  },
                  "&:disabled": {
                    background: "#e0e0e0",
                    color: "#999",
                  },
                }}
              >
                {saving ? "Creating..." : "Create Blog"}
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate("/blogs")}
                sx={{
                  flex: 1,
                  color: "#6B4E3D",
                  borderColor: "#6B4E3D",
                  "&:hover": {
                    borderColor: "#B85C38",
                    backgroundColor: "rgba(107, 78, 61, 0.1)",
                  },
                }}
              >
                Cancel
              </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default BlogCreate;
