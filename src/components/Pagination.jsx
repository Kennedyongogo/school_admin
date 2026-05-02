import {
  ArrowBackIos,
  ArrowForwardIos,
  KeyboardDoubleArrowLeft,
  KeyboardDoubleArrowRight,
} from "@mui/icons-material";
import { Box, Button, IconButton } from "@mui/material";

export default function MyPagination(props) {
  const pagesToShow = props.totalPages < 5 ? props.totalPages : 5;
  const startPage = Math.max(
    1,
    props.currentPage - Math.floor(pagesToShow / 2)
  );
  const endPage = Math.min(props.totalPages, startPage + pagesToShow - 1);

  const pageButtons = [];
  for (let page = startPage; page <= endPage; page++) {
    pageButtons.push(
      <Button
        key={page}
        variant={page === props.currentPage ? "contained" : "outlined"}
        onClick={() => {
          props.handlePageChange(page);
        }}
      >
        {page}
      </Button>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        my: 2,
      }}
    >
      <IconButton
        disabled={props.currentPage === 1}
        onClick={() => props.handlePageChange(1)}
      >
        <KeyboardDoubleArrowLeft fontSize="large" />
      </IconButton>
      <IconButton
        disabled={props.currentPage === 1}
        onClick={() => props.handlePageChange(props.currentPage - 1)}
      >
        <ArrowBackIos />
      </IconButton>
      {pageButtons}
      <IconButton
        disabled={props.currentPage === props.totalPages}
        onClick={() => props.handlePageChange(props.currentPage + 1)}
      >
        <ArrowForwardIos />
      </IconButton>
      <IconButton
        disabled={props.currentPage === props.totalPages}
        onClick={() => props.handlePageChange(props.totalPages)}
      >
        <KeyboardDoubleArrowRight fontSize="large" />
      </IconButton>
    </Box>
  );
}
