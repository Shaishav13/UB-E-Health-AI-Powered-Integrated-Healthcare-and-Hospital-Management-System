import React from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { Button } from "antd";

function Row(props) {
  const { row, onDelete, onDownloadReceipt, rowIndex } = props;
  const [open, setOpen] = React.useState(false);

  return (
    <React.Fragment>
      <TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          {row.name}
        </TableCell>
        <TableCell align="right">{row.date}</TableCell>
        <TableCell align="right">{row.time}</TableCell>
        <TableCell align="right">
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            {row.hasReceipt && onDownloadReceipt && (
              <Button
                type="default"
                size="large"
                onClick={() => onDownloadReceipt(rowIndex)}
                style={{
                  background: '#0b6b61',
                  color: 'white',
                  border: 'none',
                }}
              >
                Download Receipt
              </Button>
            )}
            <Button
              type="primary"
              size="large"
              key="Awd"
              danger
              onClick={() => onDelete(rowIndex)}
            >
              {row.buttonText}
            </Button>
          </div>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Details
              </Typography>
              <Table size="small" aria-label="purchases">
                <TableHead>
                  <TableRow>
                    <TableCell>Phone Number</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell align="right">Problem</TableCell>
                    <TableCell align="right">Fees ($)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row.details.map((detailsRow) => (
                    <TableRow key={detailsRow.phonenum}>
                      <TableCell component="th" scope="row">
                        {detailsRow.phonenum}
                      </TableCell>
                      <TableCell>{detailsRow.department}</TableCell>
                      <TableCell align="right">{detailsRow.problem}</TableCell>
                      <TableCell align="right">{detailsRow.fees}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

Row.propTypes = {
  row: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    name: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    time: PropTypes.string.isRequired,
    buttonText: PropTypes.string.isRequired,
    hasReceipt: PropTypes.bool,
    details: PropTypes.arrayOf(
      PropTypes.shape({
        phonenum: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        department: PropTypes.string.isRequired,
        problem: PropTypes.string,
        fees: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      })
    ).isRequired,
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
  onDownloadReceipt: PropTypes.func,
  rowIndex: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
};

const CollapsibleTable = (props) => {
  const { data, columns, onDelete, onDownloadReceipt } = props;

  return (
    <TableContainer component={Paper}>
      <Table aria-label="collapsible table">
        <TableHead>
          <TableRow>
            <TableCell />
            {columns.map((column, index) => (
              <TableCell key={index} align={column.align}>
                {column.label === "Name"
                  ? column.userType === "doctor"
                    ? "Patient Name"
                    : "Doctor Name"
                  : column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, index) => (
            <Row 
              key={row.id || index} 
              row={row} 
              onDelete={onDelete}
              onDownloadReceipt={onDownloadReceipt}
              rowIndex={row.id} 
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

CollapsibleTable.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      name: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired,
      time: PropTypes.string.isRequired,
      buttonText: PropTypes.string.isRequired,
      hasReceipt: PropTypes.bool,
      details: PropTypes.arrayOf(
        PropTypes.shape({
          phonenum: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
          department: PropTypes.string.isRequired,
          problem: PropTypes.string,
          fees: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
        })
      ).isRequired,
    })
  ).isRequired,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      userType: PropTypes.string,
      label: PropTypes.string.isRequired,
      align: PropTypes.oneOf(["left", "center", "right"]),
    })
  ).isRequired,
  onDelete: PropTypes.func.isRequired,
  onDownloadReceipt: PropTypes.func,
};

export default CollapsibleTable;
