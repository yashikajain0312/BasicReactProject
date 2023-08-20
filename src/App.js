import React from "react";
import _ from 'lodash';
import $ from 'jquery';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { sprintf } from "sprintf-js";
import swal from 'sweetalert';

import Select from "react-select";
import makeAnimated from "react-select/animated";

import './bootstrap.css';
import './helper.css';
import './animate.css';
import './style.css';

import EdiText from "react-editext";

import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import Loader from "react-loader-spinner";

import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
import Box from "@material-ui/core/Box";
import Collapse from "@material-ui/core/Collapse";
import IconButton from "@material-ui/core/IconButton";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import KeyboardArrowDownIcon from "@material-ui/icons/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@material-ui/icons/KeyboardArrowUp";

import MUIDataTable from "mui-datatables";
import { createMuiTheme, MuiThemeProvider } from "@material-ui/core/styles";

import RichTextEditor from "./Summernote";
import styled from "styled-components";

const useTableStyles = makeStyles({
  root: {
    // border: "solid",
  },
});

export const UseRowStyles = makeStyles({
  root: {
    "& > *": {
      borderBottom: "unset",
    },
  },
});

export const UseCellStyles = makeStyles({
  root: {
    fontSize: "small",
    // border: "solid",
  },
});

const useItemHeadingStyles = makeStyles({
  root: {
    fontSize: "medium",
  },
});

const StyledEdiText = styled(EdiText)`
  button[editext="edit-button"] {
    display: none;
  }
  button[editext="save-button"] {
    display: none;
  }
  button[editext="cancel-button"] {
    display: none;
  }
  div[editext="view-container"],
  div[editext="edit-container"] {
    max-width: fit-content;
  }
`;

function itemTypePlural(itemType) {
  return _.startCase(itemType) + "s";
}

let newVar = "ok";

function EditableTextField(props) {
  const [errTxt, setErrTxt] = React.useState(null);
  const [editing, setEditing] = React.useState(false);
  var hint = null;
  if (errTxt !== null) {
    hint = (
      <span className="custom-hint" style={{ color: "red" }}>
        <i>{errTxt}</i>
      </span>
    );
  }

  // set editable styling when not in edit mode
  var viewModeEditableStyling = "ng-binding";
  if (!editing) {
    viewModeEditableStyling += " editable-click";
    if (!props.value) {
      viewModeEditableStyling += " editable-empty";
    }
  }

  return (
    <StyledEdiText
      type={props.type}
      value={props.value}
      onEditingStart={() => setEditing(true)}
      onSave={(val) => {
        setErrTxt(null);
        // prevent save when value has not changed
        if (props.value !== val) {
          props.onSave($.trim(val));
        }
        setEditing(false);
      }}
      inputProps={{
        id: "negativeMark",
        name: "negativeMark",
        min: props.minVal ? props.minVal : null,
        placeholder: props.title,
        style: {
          outline: "none",
          minWidth: "150px",
          maxWidth: "200px",
        },
      }}
      viewProps={{
        style: {
          outline: "none",
          minWidth: "150px",
          maxWidth: "200px",
          alignItems: "inherit",
        },
      }}
      hint={hint}
      validation={(val) => {
        val = $.trim(val);
        // allow no-edit save
        return (
          val === props.value || typeof props.validate(val) === "undefined"
        );
      }}
      onValidationFail={(val) => setErrTxt(props.validate($.trim(val)))}
      onCancel={() => {
        setErrTxt(null);
        setEditing(false);
      }}
      saveButtonContent={<i className="ion-checkmark-round"></i>}
      saveButtonClassName="btn btn-success editable-submit btn-sm"
      cancelButtonClassName="btn editable-cancel btn-sm"
      cancelButtonContent={<i className="ion-close-round"></i>}
      viewContainerClassName={viewModeEditableStyling}
      mainContainerClassName={props.type === "number" ? "pull-right" : null}
      startEditingOnFocus={!props.readOnly}
      submitOnEnter={!props.readOnly}
      cancelOnEscape
      showButtonsOnHover={!props.readOnly}
      editOnViewClick={!props.readOnly}
      hideIcons
    />
  );
}

function ScoreCell(props) {
  const { item, templateData, setTemplateData, categoryType, readOnly } = props;
  const colClasses = UseCellStyles();
  return (
    <TableCell className={colClasses.root} align="right">
      <EditableTextField
        readOnly={readOnly}
        name="score"
        type="number"
        value={item.score.toString()}
        onSave={(val) =>
          setTemplateData(
            templateData.map((category) => {
              var newCategory = { ...category };
              if (newCategory.type === categoryType) {
                var childItem = newCategory.children.find(
                  (childItem) => childItem.id === item.id
                );
                if (childItem !== undefined) {
                  childItem.score = parseFloat(val);
                }
              }
              return newCategory;
            })
          )
        }
        title={`Please provide a score for this ${item.type}.`}
        validate={(value) => {
          if (isNaN(parseFloat(value))) {
            return "Score must be a number.";
          }
          if (parseFloat(value) < 0) {
            return "Score must be a positive number.";
          }
        }}
      />
    </TableCell>
  );
}

ScoreCell.prototype = {
  readOnly: PropTypes.bool.isRequired,
  item: PropTypes.object.isRequired,
  templateData: PropTypes.arrayOf(PropTypes.object).isRequired,
  setTemplateData: PropTypes.func.isRequired,
  categoryType: PropTypes.string.isRequired,
};

function ItemRow(props) {
  const {
    readOnly,
    item,
    categoryType,
    seq,
    component,
    templateData,
    setTemplateData,
    parentCategory,
    allItems,
    tmplName,
    enableScore,
    enableExamFilter,
  } = props;
  const colClasses = UseCellStyles();
  return (
    <TableRow
      key={item.id}
      component={component}
      className={item.id in allItems ? null : "danger"}
      title={
        item.id in allItems
          ? "Sub " + _.startCase(item.type)
          : `This ${item.type} should be removed from the template ` +
            `because it is not available in the selected topic${
              enableExamFilter ? " and exams" : ""
            }.`
      }
    >
      <TableCell
        className={colClasses.root}
        scope="row"
        align="right"
        colSpan={2}
      >
        {seq + 1}
      </TableCell>
      <TableCell className={colClasses.root}>{item.content}</TableCell>
      {enableScore ? (
        <ScoreCell
          readOnly={readOnly}
          item={item}
          templateData={templateData}
          setTemplateData={setTemplateData}
          categoryType={categoryType}
        />
      ) : null}
      {parentCategory === undefined ? <TableCell /> : null}
      {readOnly ? null : (
        <TableCell className={colClasses.root}>
          <a
            onClick={(ev) => {
              ev.preventDefault();
              swal(
                {
                  title: "Are you sure?",
                  text:
                    `You are removing the ${item.type} titled from this ${tmplName}: ` +
                    item.content,
                  type: "warning",
                  showCancelButton: true,
                  confirmButtonClass: "btn-danger",
                  confirmButtonText: "Yes, delete it!",
                  closeOnConfirm: true,
                },
                () => {
                  // TODO: we should fade-out the row instead of immediate removal.
                  // remove from top-level
                  var newTemplateData = templateData.filter(
                    (categoryOrItem) =>
                      categoryOrItem.type !== item.type ||
                      categoryOrItem.id !== item.id
                  );
                  setTemplateData(
                    newTemplateData.map((categoryOrItem) => {
                      if (categoryOrItem.type === categoryType) {
                        // remove from children
                        categoryOrItem.children =
                          categoryOrItem.children.filter(
                            (e) => e.id !== item.id
                          );
                      }
                      return categoryOrItem;
                    })
                  );
                }
              );
            }}
          >
            <i
              className="fa fa-trash-o"
              data-toggle="tooltip"
              data-placement="bottom"
              title="Delete"
            />
          </a>
        </TableCell>
      )}
    </TableRow>
  );
}

function TimeLimitCell(props) {
  const { category, categoryType, templateData, setTemplateData, readOnly } =
    props;
  const colClasses = UseCellStyles();
  return (
    <TableCell className={colClasses.root} align="right">
      <EditableTextField
        readOnly={readOnly}
        type="number"
        value={(category.time_limit_seconds / 60).toFixed(0).toString()}
        onSave={(val) =>
          setTemplateData(
            templateData.map((categoryOrItem) => {
              if (
                categoryOrItem.type === categoryType &&
                categoryOrItem.id === category.id
              ) {
                categoryOrItem.time_limit_seconds = 60 * parseInt(val);
              }
              return categoryOrItem;
            })
          )
        }
        minVal="0"
        title="Please provide duration in minutes."
        validate={(value) => {
          value = parseInt(value);
          if (isNaN(value)) {
            return "Time limit must be a number of minutes.";
          }
          if (value < 0) {
            return "Time limit must be a positive number.";
          }
        }}
      />
    </TableCell>
  );
}

TimeLimitCell.prototype = {
  readOnly: PropTypes.bool.isRequired,
  category: PropTypes.object.isRequired,
  categoryType: PropTypes.string.isRequired,
  templateData: PropTypes.arrayOf(PropTypes.object).isRequired,
  setTemplateData: PropTypes.func.isRequired,
};

function NegativeMarkingCell(props) {
  const { category, categoryType, templateData, setTemplateData, readOnly } =
    props;
  const colClasses = UseCellStyles();
  return (
    <TableCell className={colClasses.root} align="right">
      <EditableTextField
        readOnly={readOnly}
        type="number"
        value={(category.negative_marking_percentage || 0).toString()}
        onSave={(val) =>
          setTemplateData(
            templateData.map((categoryOrItem) => {
              var newCategoryOrItem = { ...categoryOrItem };
              if (
                categoryOrItem.type === categoryType &&
                categoryOrItem.id === category.id
              ) {
                newCategoryOrItem.negative_marking_percentage = parseInt(val);
              }
              return newCategoryOrItem;
            })
          )
        }
        title="Please provide negative marking percentage in number."
        validate={(value) => {
          value = parseInt(value);
          if (isNaN(value)) {
            return "Negative marking percentage must be a number.";
          }
          if (value < 0) {
            return "Negative marking must be a positive number.";
          }
        }}
      />
    </TableCell>
  );
}

NegativeMarkingCell.prototype = {
  readOnly: PropTypes.bool.isRequired,
  category: PropTypes.object.isRequired,
  categoryType: PropTypes.string.isRequired,
  templateData: PropTypes.arrayOf(PropTypes.object).isRequired,
  setTemplateData: PropTypes.func.isRequired,
};

function CategoryRow(props) {
  const {
    readOnly,
    itemType,
    categoryType,
    category,
    onDragEnd,
    seq,
    templateData,
    setTemplateData,
    itemViewUrlTemplate,
    csrfToken,
    allItems,
    isCategoryNameAvailable,
    tmplName,
    enableScore,
    enableTimeLimit,
    enableExamFilter,
    enableNegativeMark,
  } = props;
  const rowClasses = UseRowStyles();
  const colClasses = UseCellStyles();
  const itemHeadingClasses = useItemHeadingStyles();
  const [open, setOpen] = React.useState(
    /**
     * Keep the first category open by-default
     * REF: https://mallssrv.mynetgear.com:51700/dev/wordline/-/issues/2817
     */
    seq === 0
  );

  return (
    <React.Fragment>
      <TableRow
        className={`treeEditorCategory ${rowClasses.root}${
          category.error ? " danger" : ""
        }`}
        title={category.error}
      >
        <TableCell className={colClasses.root}>
          <IconButton
            aria-label={`expand ${categoryType}`}
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell className={colClasses.root} scope="row" align="right">
          {seq + 1}
        </TableCell>
        <TableCell className={colClasses.root}>
          <EditableTextField
            readOnly={readOnly}
            type="text"
            value={category.name}
            onSave={(val) => {
              var newTemplateData = templateData.map((categoryOrItem) => {
                if (
                  categoryOrItem.type === categoryType &&
                  categoryOrItem.id === category.id
                ) {
                  categoryOrItem.name = val;
                }
                return categoryOrItem;
              });
              setTemplateData([...newTemplateData]);
            }}
            title={`Provide a name to this ${categoryType}.`}
            validate={(value) => {
              if (value == "") {
                return _.startCase(categoryType) + " name cannot be empty.";
              }
              if (!isCategoryNameAvailable(templateData, value)) {
                return _.startCase(categoryType) + " name is already taken.";
              }
            }}
          />
        </TableCell>
        {enableScore ? (
          <>
            <TableCell className={colClasses.root} align="right">
              Total:{" "}
              {templateData
                .find((categoryOrItem) => categoryOrItem.id === category.id)
                .children.map((item) => item.score)
                .reduce(function (totalScore, curScore) {
                  return totalScore + curScore;
                }, 0.0)
                .toFixed(2)}
            </TableCell>
            {enableNegativeMark ? (
              <NegativeMarkingCell
                readOnly={readOnly}
                category={category}
                categoryType={categoryType}
                templateData={templateData}
                setTemplateData={setTemplateData}
              />
            ) : null}
          </>
        ) : null}
        {enableTimeLimit ? (
          <TimeLimitCell
            readOnly={readOnly}
            category={category}
            categoryType={categoryType}
            templateData={templateData}
            setTemplateData={setTemplateData}
          />
        ) : null}
        {readOnly ? null : (
          <TableCell className={colClasses.root}>
            <a
              onClick={(ev) => {
                ev.preventDefault();
                swal(
                  {
                    title: "Are you sure?",
                    text:
                      `You are removing an entire ${categoryType} with ` +
                      category.children.length.toString() +
                      ` ${itemType}(s).`,
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonClass: "btn-danger",
                    confirmButtonText: "Yes, delete it!",
                    closeOnConfirm: true,
                  },
                  () => {
                    // TODO: we should fade-out the row instead of immediate removal.
                    setTemplateData(
                      templateData.filter(
                        (categoryOrItem) =>
                          categoryOrItem.type !== categoryType ||
                          categoryOrItem.id !== category.id
                      )
                    );
                  }
                );
              }}
            >
              <i
                className="fa fa-trash-o"
                data-toggle="tooltip"
                data-placement="bottom"
                title="Delete"
              />
            </a>
          </TableCell>
        )}
      </TableRow>
      <TableRow>
        <TableCell
          className={colClasses.root}
          style={{
            paddingBottom: 0,
            paddingTop: 0,
            backgroundColor: open ? "#F3F5F6" : "white",
          }}
          colSpan={6}
        >
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box margin={1}>
              <Typography
                variant="h6"
                gutterBottom
                component="div"
                className={itemHeadingClasses.root}
              >
                {itemTypePlural(itemType)}
              </Typography>
              {readOnly ? null : (
                <ChooseItemsModalPopup
                  csrfToken={csrfToken}
                  templateData={templateData}
                  setTemplateData={setTemplateData}
                  parentCategory={category}
                  itemViewUrlTemplate={itemViewUrlTemplate}
                  allItems={allItems}
                  itemType={itemType}
                  categoryType={categoryType}
                  enableScore={enableScore}
                  enableExamFilter={enableExamFilter}
                />
              )}
              {category.children.length === 0 ? (
                <div className="row">
                  <div className="col-sm-12">
                    <div className="alert alert-info fade in">
                      You have not selected any
                      {` ${itemType}s `}
                      yet. You can click on{" "}
                      <strong>Choose {itemTypePlural(itemType)}</strong> to
                      select some {itemType}s for this {categoryType}.
                    </div>
                  </div>
                </div>
              ) : (
                <Table
                  size="small"
                  aria-label={`${itemType}s`}
                  className="table tblItems"
                >
                  <TableHead>
                    <TableRow>
                      <TableCell
                        className={colClasses.root}
                        align="right"
                        colSpan={2}
                      >
                        #
                      </TableCell>
                      <TableCell className={colClasses.root}>Title</TableCell>
                      {enableScore ? (
                        <TableCell className={colClasses.root} align="right">
                          Score
                        </TableCell>
                      ) : null}
                      {readOnly ? null : (
                        <TableCell className={colClasses.root}>
                          Action
                        </TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody component={DroppableComponent(onDragEnd)}>
                    {category.children.map((item, itemSeq) => (
                      <ItemRow
                        readOnly={readOnly}
                        key={`item-${item.id}`}
                        item={item}
                        categoryType={categoryType}
                        seq={itemSeq}
                        component={DraggableComponent(
                          item.id.toString(),
                          itemSeq
                        )}
                        templateData={templateData}
                        setTemplateData={setTemplateData}
                        parentCategory={category}
                        allItems={allItems}
                        tmplName={tmplName}
                        enableScore={enableScore}
                        enableExamFilter={enableExamFilter}
                      />
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

// TODO: Validator:
// Row.propTypes = {
//   row: PropTypes.shape({
//     calories: PropTypes.number.isRequired,
//     carbs: PropTypes.number.isRequired,
//     fat: PropTypes.number.isRequired,
//     history: PropTypes.arrayOf(
//       PropTypes.shape({
//         amount: PropTypes.number.isRequired,
//         customerId: PropTypes.string.isRequired,
//         date: PropTypes.string.isRequired,
//       }),
//     ).isRequired,
//     name: PropTypes.string.isRequired,
//     price: PropTypes.number.isRequired,
//     protein: PropTypes.number.isRequired,
//   }).isRequired,
// };

// a little function to help us with reordering the result
const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

const getItemStyle = (isDragging, draggableStyle) => ({
  // styles we need to apply on draggables
  ...draggableStyle,

  ...(isDragging && {
    background: "lightblue",
  }),
});

function onDragEnd(category, result, templateData, setTemplateData) {
  // dropped outside the list
  if (!result.destination) {
    return;
  }

  const newTemplateData = templateData.map((tmp) => {
    if (tmp.id !== category.id) {
      return tmp;
    }
    tmp.children = reorder(
      tmp.children,
      result.source.index,
      result.destination.index
    );
    return tmp;
  });

  setTemplateData(newTemplateData);
}

function getAllItemIds(templateData, itemType) {
  var qIds = [];
  templateData.forEach((itemOrCategory) => {
    if (itemOrCategory.type === itemType) {
      qIds.push(itemOrCategory.id);
    } else {
      itemOrCategory.children.forEach((item) => qIds.push(item.id));
    }
  });
  return qIds;
}

export const GetMuiTheme = () =>
  createMuiTheme({
    overrides: {
      // DataTable
      MUIDataTable: {
        root: {
          fontSize: "small",
        },
      },
      MUIDataTableBodyCell: {
        root: {
          fontSize: "small",
          // border: "solid",
        },
      },
      MUIDataTableBodyRow: {
        root: {
          fontSize: "small",
          // border: "solid",
        },
      },
      MUIDataTableHeadCell: {
        root: {
          fontSize: "small",
          // border: "solid",
        },
        data: {
          fontSize: "small",
        },
      },
      MUIDataTableHeadRow: {
        root: {
          fontSize: "small",
          // border: "solid",
        },
      },
      MUIDataTableToolbar: {
        root: {
          fontSize: "small",
        },
      },
      MUIDataTablePagination: {
        root: {
          fontSize: "small",
        },
      },

      // Table
      MuiTable: {
        root: {
          fontSize: "small",
        },
      },
      MuiTableCell: {
        root: {
          fontSize: "small",
          // border: "solid",
        },
      },
      MuiTableRow: {
        root: {
          fontSize: "small",
          // border: "solid",
        },
      },
      MuiTableHead: {
        root: {
          fontSize: "small",
          // border: "solid",
        },
      },
      MuiTablePagination: {
        root: {
          fontSize: "small",
        },
      },

      MuiTypography: {
        root: {
          fontSize: "small",
        },
        body2: {
          fontSize: "small",
        },
      },
      MuiInputBase: {
        input: {
          fontSize: "small",
        },
      },
      MuiButtonBase: {
        root: {
          fontSize: "large",
        },
      },
      MuiSvgIcon: {
        root: {
          fontSize: "large",
        },
      },
      MuiListItem: {
        root: {
          fontSize: "small",
        },
      },
      MuiMenuItem: {
        root: {
          fontSize: "small",
        },
      },
      MuiTooltip: {
        tooltip: {
          fontSize: "small",
        },
      },
      MuiFormLabel: {
        root: {
          fontSize: "medium",
        },
      },
      MuiIconButton: {
        root: {
          fontSize: "medium",
        },
      },
    },
  });

// TODO: prevent having to call this for each category.
function ItemSearchResults(props) {
  const {
    templateData,
    setTemplateData,
    parentCategory,
    itemViewUrlTemplate,
    allItems,
    itemType,
    categoryType,
    enableScore,
    enableExamFilter,
  } = props;
  var usedItems = getAllItemIds(templateData, itemType);
  console.log("usedItems", usedItems);
  const data = Object.keys(newVar)
    .filter((itemId) => !usedItems.includes(parseInt(itemId)))
    .map((itemId) => ({
      id: parseInt(itemId),
      name: newVar[itemId].summary,
    }));
  console.log("data", data);
  return (
    <MuiThemeProvider theme={GetMuiTheme()}>
      <MUIDataTable
        className="datatable-editable"
        data={data}
        columns={[
          {
            name: "name",
            label: "Name",
            options: {
              filter: true,
              sort: true,
            },
          },
          {
            name: "Actions",
            options: {
              filter: false,
              sort: false,
              empty: true,
              setCellProps: (cellValue, rowIndex, colIndex) => {
                return {
                  className:
                    colIndex === 1
                      ? "actions"
                      : "" /* for datatable-editable style class */,
                };
              },
              customBodyRenderLite: (dataIndex) => {
                return (
                  <React.Fragment>
                    <a
                      name="addItem"
                      onClick={(ev) => {
                        ev.preventDefault();
                        // TODO: we should fade-out the row instead of immediate removal.
                        var item = {
                          id: data[dataIndex].id,
                          type: itemType,
                          content: data[dataIndex].name,
                        };
                        if (enableScore) {
                          item.score = 0;
                        }
                        if (parentCategory === undefined) {
                          templateData.push(item);
                        } else {
                          templateData
                            .find(
                              (e) =>
                                e.type === categoryType &&
                                e.id === parentCategory.id
                            )
                            .children.push(item);
                        }
                        setTemplateData([...templateData]);
                      }}
                    >
                      <i
                        className="fa fa-plus"
                        data-toggle="tooltip"
                        data-placement="bottom"
                        title="Add"
                      />
                    </a>
                    <a
                      href={sprintf(itemViewUrlTemplate, data[dataIndex].id)}
                      target="_blank"
                      className="on-default"
                    >
                      <i
                        className="fa fa-eye"
                        data-toggle="tooltip"
                        data-placement="bottom"
                        title="View this question"
                      />
                    </a>
                  </React.Fragment>
                );
              },
            },
          },
        ]}
        options={{
          filter: false,
          selectableRows: "none",
          onRowsDelete: () => {
            return false;
          },
          pagination: true,
          rowsPerPageOptions: [],
          textLabels: {
            body: {
              noMatch:
                usedItems.length > 0 && data.length == 0
                  ? `Sorry, no more ${itemType}s are left for the selected topic${
                      enableExamFilter ? " and exams" : ""
                    }.`
                  : `Sorry, no ${itemType}s found for the selected topic${
                      enableExamFilter ? " and exams" : ""
                    }.`,
            },
          },
        }}
      />
    </MuiThemeProvider>
  );
}

function ChooseItemsModalPopup(props) {
  const {
    readOnly,
    templateData,
    setTemplateData,
    parentCategory,
    itemViewUrlTemplate,
    csrfToken,
    allItems,
    itemType,
    categoryType,
    enableScore,
    enableExamFilter,
  } = props;
  return (
    <React.Fragment>
      <div
        id={`choose-items-modal-${parentCategory.id}`}
        className="modal fade choose-items-modal"
        tabIndex="-1"
        role="dialog"
        aria-labelledby={`choose-items-modal-btn-${parentCategory.id}`}
        aria-hidden="true"
        style={{ display: "none" }}
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <button
                type="button"
                className="close"
                data-dismiss="modal"
                aria-hidden="true"
              >
                ×
              </button>
              <h4 className="modal-title">
                Add {itemTypePlural(itemType)} to {parentCategory.name}
              </h4>
            </div>
            <form action="#" method="POST">
              <input name="_token" value={csrfToken} type="hidden" />
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-12">
                    <div className="form-group">
                      <ItemSearchResults
                        templateData={templateData}
                        setTemplateData={setTemplateData}
                        parentCategory={parentCategory}
                        itemViewUrlTemplate={itemViewUrlTemplate}
                        allItems={allItems}
                        itemType={itemType}
                        categoryType={categoryType}
                        enableScore={enableScore}
                        enableExamFilter={enableExamFilter}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-white"
                  data-dismiss="modal"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {readOnly ? null : (
        <div className="row">
          <div className="m-b-30 pull-right">
            <button
              className="btn btn-primary waves-effect waves-light"
              data-toggle="modal"
              data-target={`#choose-items-modal-${parentCategory.id}`}
              id={`choose-items-modal-btn-${parentCategory.id}`}
              disabled={false}
              type="button"
            >
              Choose {itemTypePlural(itemType)} &nbsp;
              <i className="fa fa-plus" />
            </button>
          </div>
        </div>
      )}
    </React.Fragment>
  );
}

const DraggableComponent = (id, index) => (props) => {
  return (
    <Draggable draggableId={id} index={index}>
      {(provided, snapshot) => (
        <TableRow
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={getItemStyle(
            snapshot.isDragging,
            provided.draggableProps.style
          )}
          {...props}
        >
          {props.children}
        </TableRow>
      )}
    </Draggable>
  );
};

const DroppableComponent = (onDragEnd) => (props) => {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {/* TODO: why is this droppable id hard-coded ? There can be more than '1' categories ... */}
      <Droppable droppableId={"1"} direction="vertical">
        {(provided) => {
          return (
            <TableBody
              ref={provided.innerRef}
              {...provided.droppableProps}
              {...props}
            >
              {props.children}
              {provided.placeholder}
            </TableBody>
          );
        }}
      </Droppable>
    </DragDropContext>
  );
};

function getTotalScore(templateData, categoryType) {
  var score = 0.0;
  templateData.forEach((categoryOrItem) => {
    if (categoryOrItem.type === categoryType) {
      score += categoryOrItem.children.reduce((totalScore, item) => {
        return totalScore + item.score;
      }, 0.0);
    } else {
      score += categoryOrItem.score;
    }
  });
  return score;
}

function TemplateEditor(props) {
  const {
    readOnly,
    itemType,
    categoryType,
    itemViewUrlTemplate,
    csrfToken,
    templateData,
    setTemplateData,
    allItems,
    isCategoryNameAvailable,
    tmplName,
    enableScore,
    enableTimeLimit,
    enableExamFilter,
    customCategories,
    enableNegativeMark,
  } = props;
  const tableClasses = useTableStyles();
  const colClasses = UseCellStyles();

  var rows = [];
  templateData.forEach((category, seq) => {
    if (category.type === categoryType) {
      rows.push(
        <CategoryRow
          readOnly={readOnly}
          itemType={itemType}
          categoryType={categoryType}
          tmplName={tmplName}
          key={`category-${category.id}`}
          category={category}
          seq={seq}
          templateData={templateData}
          setTemplateData={setTemplateData}
          onDragEnd={(result) =>
            onDragEnd(category, result, templateData, setTemplateData)
          }
          itemViewUrlTemplate={itemViewUrlTemplate}
          csrfToken={csrfToken}
          allItems={allItems}
          isCategoryNameAvailable={isCategoryNameAvailable}
          enableScore={enableScore}
          enableTimeLimit={enableTimeLimit}
          enableExamFilter={enableExamFilter}
          enableNegativeMark={enableNegativeMark}
        />
      );
    } else if (category.type in customCategories) {
      const CustomCategoryRow = customCategories[category.type];
      rows.push(
        <CustomCategoryRow
          key={`custom-category-${category.type}-${category.id}`}
          category={category}
          seq={seq}
          templateData={templateData}
          setTemplateData={setTemplateData}
          enableScore={enableScore}
          enableTimeLimit={enableTimeLimit}
          enableNegativeMark={enableNegativeMark}
        />
      );
    } else {
      throw new Error(
        sprintf("unhandled category type: %s", JSON.stringify(category))
      );
    }
  });

  const totalScore = getTotalScore(templateData, categoryType).toFixed(2);

  return (
    <TableContainer component={Paper}>
      <Table
        aria-label={`${categoryType}s and ${itemType}s table`}
        className={`table ${tableClasses.root}`}
      >
        <TableHead>
          <TableRow>
            <TableCell className={colClasses.root} align="right" colSpan={2}>
              #
            </TableCell>
            <TableCell className={colClasses.root}>Title</TableCell>
            {enableScore ? (
              <>
                <TableCell className={colClasses.root} align="right">
                  Score (Total: {totalScore})
                </TableCell>
                {enableNegativeMark ? (
                  <TableCell className={colClasses.root} align="right">
                    Negative Marking (%)
                  </TableCell>
                ) : null}
              </>
            ) : null}
            {enableTimeLimit ? (
              <TableCell className={colClasses.root} align="right">
                Time (minutes)
              </TableCell>
            ) : null}
            {readOnly ? null : (
              <TableCell className={colClasses.root}>Action</TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>{rows}</TableBody>
      </Table>
    </TableContainer>
  );
}

TemplateEditor.prototype = {
  readOnly: PropTypes.bool.isRequired,
  itemType: PropTypes.string.isRequired,
  categoryType: PropTypes.string.isRequired,
  itemViewUrlTemplate: PropTypes.string.isRequired,
  csrfToken: PropTypes.string.isRequired,
  templateData: PropTypes.arrayOf(PropTypes.object).isRequired,
  setTemplateData: PropTypes.func.isRequired,
  allItems: PropTypes.arrayOf(PropTypes.object).isRequired,
  isCategoryNameAvailable: PropTypes.func.isRequired,
  tmplName: PropTypes.string.isRequired,
  enableScore: PropTypes.bool.isRequired,
  enableTimeLimit: PropTypes.bool.isRequired,
  enableExamFilter: PropTypes.bool.isRequired,
  customCategories: PropTypes.object,
  enableNegativeMark: PropTypes.bool.isRequired,
};

function validateTemplateData(
  templateData,
  allItems,
  itemType,
  categoryType,
  enableExamFilter
) {
  // Verify that all items are available in allItems.
  for (const category of templateData) {
    if (category.type !== categoryType) {
      // ignore custom categories
      continue;
    }
    for (const item of category.children) {
      if (!(item.id in newVar)) {
        return (
          _.startCase(itemType) +
          ` ${item.content} is not available in the selected topic${
            enableExamFilter ? " and exams" : ""
          }.`
        );
      }
    }
  }
}

const animatedComponents = makeAnimated();
// AJAX-IO chain to avoid one JSON response from clobbering the other.
const ajaxIOChain = Promise.resolve();

function buildItemListUrl(
  itemsListUrlTemplate,
  topicId,
  enableExamFilter,
  examIds
) {
  var url;
  if (enableExamFilter) {
    url = sprintf(itemsListUrlTemplate, topicId, encodeURIComponent(examIds));
  } else {
    url = sprintf(itemsListUrlTemplate, topicId);
  }
  return url;
}

function Exams(props) {
  const {
    readOnly,
    allExams,
    examIds,
    setExamIds,
    addExamUrl,
    topicId,
    itemsListUrlTemplate,
    setAllItems,
    allItems,
    setExperi,
    experi,
    enableExamFilter,
  } = props;

  var defaultExamValues = examIds.map((examId) => {
    return {
      value: examId,
      label: allExams.find((e) => e.id === examId).name,
      color: "#666",
    };
  });

  console.log("newVar", newVar);
  const helper = (data) => {
    // setAllItems(null);
    console.log("helper exam");
    var newExamIds = data.map((e) => e.value);
    ajaxIOChain.then(
      $.getJSON(
        buildItemListUrl(
          itemsListUrlTemplate,
          topicId,
          enableExamFilter,
          newExamIds
        ),
        (resp) => {
          newVar = resp;
          setAllItems(resp);
          setExperi("second");
          console.log("resp", resp);
        }
      ).fail((resp) => {
        console.log(resp);
        swal({
          title: "Failed to load the GetQuestions API",
          text: "Please check the submission.",
          type: "error",
          showCancelButton: false,
          confirmButtonClass: "btn-success",
          confirmButtonText: "Retry ...",
          closeOnConfirm: true,
        });
      })
    );
    setExamIds(newExamIds);
  };
  return (
    <div className="form-group">
      <label htmlFor="exam_id" className="col-sm-2 control-label">
        Exams * {allItems != null ? Object.keys(allItems).length : "null"}
        {experi === "init" ? "notchanged" : "changed"}
        {Object.keys(newVar).length}
      </label>
      <div className="col-sm-10">
        <Select
          isDisabled={readOnly}
          className="basic-single"
          classNamePrefix="exam_select"
          isSearchable={true}
          name="exam_id[]"
          id="exam_id"
          options={allExams.map((t) => {
            return {
              value: t.id,
              label: t.name,
              color: "#666",
            };
          })}
          onChange={(data) => {
            // setAllItems(null);
            // var newExamIds = data.map((e) => e.value);
            // // TODO: handle error cace
            // ajaxIOChain.then(
            //     $.getJSON(
            //         buildItemListUrl(
            //             itemsListUrlTemplate,
            //             topicId,
            //             enableExamFilter,
            //             newExamIds
            //         ),
            //         setAllItems
            //     )
            // );
            // setExamIds(newExamIds);
            helper(data);
          }}
          isMulti
          components={animatedComponents}
          backspaceRemovesValue
          defaultValue={defaultExamValues}
          blurInputOnSelect
          closeMenuOnSelect
        />
        <p>
          If you want to add a new exam then{" "}
          <a target="_blank" href={addExamUrl}>
            click here
          </a>
          .
        </p>
      </div>
    </div>
  );
}

Exams.prototype = {
  readOnly: PropTypes.bool.isRequired,
  allExams: PropTypes.arrayOf(PropTypes.object).isRequired,
  examIds: PropTypes.arrayOf(PropTypes.number).isRequired,
  setExamIds: PropTypes.func.isRequired,
  addExamUrl: PropTypes.string.isRequired,
  topicId: PropTypes.number.isRequired,
  itemsListUrlTemplate: PropTypes.string.isRequired,
  enableExamFilter: PropTypes.bool.isRequired,
};

export function EditorPanel(props) {
  const {
    readOnly,
    itemType,
    categoryType,
    allTopics,
    allExams,
    tmplListUrl,
    addTopicUrl,
    enableExamFilter,
    addExamUrl,
    itemViewUrlTemplate,
    itemsListUrlTemplate,
    csrfToken,
    tmplSubmissionUrl,
    charLimit,
    instructions,
    name,
    AdditionalSettingsComponent,
    genNewCategory,
    isCategoryNameAvailable,
    tmplName,
    enableScore,
    duplicateNameCheckUrlFmt,
    CustomHelperButtons,
    customCategories,
    enableTimeLimit: enableTimeLimitInitial,
    enableNegativeMark: enableNegativeMarkInitial,
  } = props;
  const [templateData, setTemplateData] = React.useState(props.templateData);
  const [topicId, setTopicId] = React.useState(
    props.topicId ? props.topicId : 0
  );
  const [examIds, setExamIds] = React.useState(
    props.examIds ? props.examIds : []
  );
  const [release, setRelease] = React.useState(false);
  const [nameErr, setNameErr] = React.useState("");
  const [allItems, setAllItems] = React.useState(null);
  const [tmplId, setPtId] = React.useState(props.tmplId);
  const [errors, setErrors] = React.useState({});
  const [enableTimeLimit, setEnableTimeLimit] = React.useState(
    enableTimeLimitInitial
  );
  const [enableNegativeMark, setEnableNegativeMark] = React.useState({});
  const [fileName, setFileName] = React.useState("");
  const [experi, setExperi] = React.useState("init");

  var ipfsHash = "";
  const uploadImage = () => {
    const formdata = new FormData();
    formdata.set("file", $("input[id=upload_course_image]")[0].files[0]);

    $.ajax({
      type: "POST",
      async: false,
      cache: false,
      contentType: false,
      processData: false,
      url: "/papi/course-structure/course-image",
      data: formdata,
      success: (data) => {
        ipfsHash = data.hash;
      },
      error: function (error) {
        ipfsHash = "error";
        swal({
          title: "Failed to upload the file.",
          text: "Please check your file submission.",
          type: "error",
          showConfirmButton: true,
          confirmButtonText: "Okay",
        });
      },
    });
    return ipfsHash;
  };

  if (readOnly && tmplId === 0) {
    console.log("we do not have a template to be shown in read-only mode");
    return;
  }

  console.log("all item", allItems);
  React.useEffect(() => {
    if (topicId != 0 && (!enableExamFilter || examIds.length > 0)) {
      ajaxIOChain.then(
        $.getJSON(
          buildItemListUrl(
            itemsListUrlTemplate,
            topicId,
            enableExamFilter,
            examIds
          ),
          setAllItems
        )
      );
    }
    // this method is used only for testing
    window.renameTemplateCategory = (oldName, newName) => {
      var newTemplateData = templateData.map((categoryOrItem) => {
        if (
          categoryOrItem.type === categoryType &&
          categoryOrItem.name === oldName
        ) {
          categoryOrItem.name = newName;
        }
        return categoryOrItem;
      });
      setTemplateData([...newTemplateData]);
    };
    if (enableTimeLimit) {
      window.setCategoryTimeLimit = (categoryName, timeLimitSeconds) => {
        var newTemplateData = templateData.map((categoryOrItem) => {
          if (
            categoryOrItem.type === categoryType &&
            categoryOrItem.name === categoryName
          ) {
            categoryOrItem.time_limit_seconds = timeLimitSeconds;
          }
          return categoryOrItem;
        });
        setTemplateData([...newTemplateData]);
      };
    }
    if (enableScore) {
      window.setItemScore = (itemName, itemScore) => {
        var newTemplateData = templateData.map((categoryOrItem) => {
          if (categoryOrItem.type === categoryType) {
            var childItem = categoryOrItem.children.find(
              (childItem) => childItem.content === itemName
            );
            if (childItem !== undefined) {
              childItem.score = itemScore;
            }
          } else if (
            categoryOrItem.type === itemType &&
            categoryOrItem.content === itemName
          ) {
            categoryOrItem.score = itemScore;
          }
          return categoryOrItem;
        });
        setTemplateData([...newTemplateData]);
      };
    }
    if (enableNegativeMark) {
      window.setCategoryNegativeMark = (
        categoryName,
        negativeMarkPercentage
      ) => {
        var newTemplateData = templateData.map((categoryOrItem) => {
          if (
            categoryOrItem.type === categoryType &&
            categoryOrItem.name === categoryName
          ) {
            categoryOrItem.negative_marking_percentage = negativeMarkPercentage;
          }
          return categoryOrItem;
        });
        setTemplateData([...newTemplateData]);
      };
    }
  }, []);

  var tmplValidityCheck = null;
  if (allItems !== null) {
    tmplValidityCheck = validateTemplateData(
      templateData,
      allItems,
      itemType,
      categoryType,
      enableExamFilter
    );
  }

  var defaultTopicValue = null;
  if (topicId !== 0) {
    defaultTopicValue = {
      value: topicId,
      label: allTopics.find((t) => t.id === topicId).name,
      color: "#666",
    };
  }

  var itemCountsComponent = null;
  if (allItems) {
    const itemCount = Object.keys(allItems).length;
    itemCountsComponent = (
      <span className="help-block">
        There {itemCount <= 1 ? "is" : "are"}{" "}
        {itemCount === 0 ? "no" : itemCount} {itemType}
        {itemCount <= 1 ? "" : "s"} in this topic
        {enableExamFilter ? " and exam(s)" : ""}.
      </span>
    );

    if (allItems.length === 0) {
      itemCountsComponent = (
        <span className="help-block">item count is empty</span>
      );
    }
  }

  const topicHelper = (data) => {
    // setAllItems(null);
    ajaxIOChain.then(
      $.getJSON(
        buildItemListUrl(
          itemsListUrlTemplate,
          data.value,
          enableExamFilter,
          examIds
        ),
        (resp) => {
          setAllItems(resp);
          console.log("resp", resp);
        }
      ).fail((resp) => {
        console.log(resp);
        swal({
          title: "Failed to load the GetQuestions API",
          text: "Please check the submission.",
          type: "error",
          showCancelButton: false,
          confirmButtonClass: "btn-success",
          confirmButtonText: "Retry ...",
          closeOnConfirm: true,
        });
      })
    );
    setTopicId(data.value);
  };

  return (
    <div className="wraper container-fluid">
      <div className="page-title">
        <h3 className="title">
          {(readOnly
            ? "View your "
            : tmplId
            ? "Update your "
            : "Create a new ") + tmplName}
        </h3>
      </div>

      <div className="row">
        <div className="col-md-12">
          <div className="panel panel-default">
            <div className="panel-heading">
              <h3 className="panel-title text-capitalize">Settings</h3>
            </div>
            <div className="panel-body">
              <form
                className="form-horizontal p-20"
                role="form"
                id="editor-form"
              >
                <input type="hidden" name="_token" value={csrfToken} />
                <input type="hidden" name="release" value={release} />
                <input type="hidden" name="file_hash" defaultValue={""} />
                <input
                  type="hidden"
                  name="templateData"
                  value={JSON.stringify(templateData)}
                />
                {!tmplId ? null : (
                  <input type="hidden" name="template_id" value={tmplId} />
                )}
                <div className="form-group">
                  <label htmlFor="name" className="col-sm-2 control-label">
                    Name *
                  </label>
                  <div className="col-sm-10">
                    <input
                      readOnly={readOnly}
                      type="text"
                      name="name"
                      placeholder={`Name of your ${tmplName} ...`}
                      id="name"
                      className="form-control required"
                      autoFocus
                      defaultValue={name}
                      onChange={(ev) => {
                        var newName = $(ev.target).val();
                        if (
                          newName === name ||
                          // TODO: duplicate name check
                          // will be different for
                          // course-structure
                          !duplicateNameCheckUrlFmt
                        ) {
                          return;
                        }
                        var uri = sprintf(
                          duplicateNameCheckUrlFmt,
                          encodeURIComponent(newName)
                        );
                        ajaxIOChain.then(
                          $.getJSON(uri, (data) => {
                            if (data != null && data.exists) {
                              setNameErr(
                                `The given ${tmplName} name has already been taken.`
                              );
                            } else {
                              setNameErr("");
                            }
                          }).fail(() =>
                            console.log("Failed to verify the name given name.")
                          )
                        );
                      }}
                    />
                    {nameErr === "" ? null : (
                      <span className="error invalid-feedback" role="alert">
                        <strong>{nameErr}</strong>
                      </span>
                    )}
                    {errors.name ? (
                      <span className="error invalid-feedback" role="alert">
                        <strong>{errors.name[0]}</strong>
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="topic_id" className="col-sm-2 control-label">
                    Topic * {experi}
                  </label>
                  <div className="col-sm-10">
                    <Select
                      isDisabled={readOnly}
                      className="basic-single"
                      classNamePrefix="topic_select"
                      isSearchable={true}
                      name="topic_id"
                      id="topic_id"
                      options={allTopics.map((t) => {
                        return {
                          value: t.id,
                          label: t.name,
                          color: "#666",
                        };
                      })}
                      onChange={(data) => {
                        // setAllItems(null);
                        // TODO: handle error cace
                        // ajaxIOChain.then(
                        //     $.getJSON(
                        //         buildItemListUrl(
                        //             itemsListUrlTemplate,
                        //             data.value,
                        //             enableExamFilter,
                        //             examIds
                        //         ),
                        //         setAllItems
                        //     )
                        // );
                        // setTopicId(data.value);
                        topicHelper(data);
                      }}
                      backspaceRemovesValue
                      defaultValue={defaultTopicValue}
                      blurInputOnSelect
                      closeMenuOnSelect
                    />
                    <p>
                      If you want to add a new topic then{" "}
                      <a target="_blank" href={addTopicUrl}>
                        click here
                      </a>
                      .
                    </p>
                  </div>
                </div>
                {enableExamFilter ? (
                  <Exams
                    readOnly={readOnly}
                    allExams={allExams}
                    examIds={examIds}
                    setExamIds={setExamIds}
                    addExamUrl={addExamUrl}
                    topicId={topicId}
                    itemsListUrlTemplate={itemsListUrlTemplate}
                    setAllItems={setAllItems}
                    allItems={allItems}
                    setExperi={setExperi}
                    experi={experi}
                    enableExamFilter={enableExamFilter}
                  />
                ) : null}
                <div className="form-group">
                  <label className="col-sm-2 control-label"></label>
                  <div className="col-sm-10">
                    <Collapse in={allItems !== null}>
                      {itemCountsComponent}
                    </Collapse>
                  </div>
                </div>
                <div className="form-group">
                  <label className="col-sm-2 control-label">Instructions</label>
                  <div className="col-sm-10">
                    <RichTextEditor
                      disabled={readOnly}
                      disableInsert={true}
                      htmlData={instructions}
                      height={250}
                      charLimit={charLimit}
                      tagName="instructions"
                      formId="editor-form"
                    />
                    <span className="error invalid-feedback" role="alert">
                      <strong></strong>
                    </span>
                  </div>
                </div>
                {enableExamFilter ? null : (
                  <div className="form-group">
                    <label
                      htmlFor="upload_course_image"
                      className="control-label col-lg-2"
                    ></label>
                    <div className="col-md-10">
                      <input
                        className="form-control"
                        type="file"
                        id="upload_course_image"
                        name="upload"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        // ref={inputRef}
                      />
                    </div>
                    <label className="control-label col-lg-2"></label>
                    <div
                      className="col-md-10"
                      style={{
                        color: "grey",
                      }}
                    >
                      Note: You can skip this field if you don't want to upload
                      the image. In that case, there will be a default image on
                      the course.
                    </div>
                  </div>
                )}
                {AdditionalSettingsComponent ? (
                  <AdditionalSettingsComponent
                    errors={errors}
                    setEnableTimeLimit={setEnableTimeLimit}
                    setEnableNegativeMark={setEnableNegativeMark}
                    templateData={templateData}
                    setTemplateData={setTemplateData}
                    readOnly={readOnly}
                  />
                ) : null}
              </form>
            </div>
          </div>
        </div>
      </div>

      {allItems === null ? (
        <Loader
          visible={topicId !== 0 && examIds.length > 0}
          type="Puff"
          color="#00BFFF"
          height={100}
          width={100}
          timeout={60000} // 60 secs
        />
      ) : (
        <React.Fragment>
          <div className="row">
            <div className="col-md-12">
              <div className="panel panel-default">
                <div className="panel-heading">
                  <h3 className="panel-title text-capitalize">
                    Customize your template
                  </h3>
                </div>
                <div className="panel-body">
                  {readOnly ? null : (
                    <div className="pull-right">
                      <button
                        className="btn btn-primary waves-effect waves-light"
                        onClick={(ev) => {
                          ev.preventDefault();
                          templateData.push(genNewCategory(templateData));
                          setTemplateData([...templateData]);
                        }}
                        type="button"
                      >
                        Add {_.startCase(categoryType)} &nbsp;{" "}
                        <i className="fa fa-plus"></i>
                      </button>{" "}
                      {CustomHelperButtons ? (
                        <>
                          <CustomHelperButtons
                            templateData={templateData}
                            setTemplateData={setTemplateData}
                            csrfToken={csrfToken}
                          />{" "}
                        </>
                      ) : null}
                      <button
                        className="btn btn-danger waves-effect waves-light"
                        onClick={(ev) => {
                          ev.preventDefault();
                          swal(
                            {
                              title: "Are you sure?",
                              text: `Resetting will remove all the ${categoryType}s and ${itemType}s from this template.`,
                              type: "warning",
                              showCancelButton: true,
                              confirmButtonClass: "btn-danger",
                              confirmButtonText: "Yes, reset this template!",
                              closeOnConfirm: true,
                            },
                            () => {
                              // Always initialize with one category.
                              // TODO: we should fade-out all the rows instead of immediate removal.
                              setTemplateData([genNewCategory([])]);
                            }
                          );
                        }}
                        type="button"
                      >
                        Reset &nbsp;
                        <i className="fa fa-eraser" />
                      </button>
                    </div>
                  )}
                  <TemplateEditor
                    readOnly={readOnly}
                    itemType={itemType}
                    categoryType={categoryType}
                    tmplName={tmplName}
                    templateData={templateData}
                    setTemplateData={setTemplateData}
                    itemViewUrlTemplate={itemViewUrlTemplate}
                    csrfToken={csrfToken}
                    allItems={allItems}
                    isCategoryNameAvailable={isCategoryNameAvailable}
                    enableScore={enableScore}
                    enableTimeLimit={enableTimeLimit}
                    enableExamFilter={enableExamFilter}
                    customCategories={customCategories}
                    enableNegativeMark={enableNegativeMark}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-12">
              <div className="panel panel-default">
                <div className="panel-body">
                  <br />
                  <div className="form-group">
                    <label className="cr-styled">
                      <input
                        type="checkbox"
                        name="release"
                        id="release"
                        checked={release}
                        onChange={() => setRelease(!release)}
                      />
                      <i className="fa"></i>
                      {tmplName === "Course Structure"
                        ? "Release Course"
                        : "Release Template"}
                      <span className="help-block">
                        <small>
                          {tmplName === "Course Structure"
                            ? "Releasing this course makes it available to the students immediately and prevents any further changes to this course structure."
                            : "Releasing this template makes it available to the students immediately and prevents any further changes to this template."}
                        </small>
                      </span>
                    </label>
                    {errors.releaseTemp && (
                      <React.Fragment>
                        <br />
                        <br />
                        <span className="error invalid-feedback" role="alert">
                          <strong>{errors.releaseTemp[0]}</strong>
                        </span>
                      </React.Fragment>
                    )}
                  </div>

                  <div className="form-group m-b-0">
                    {readOnly ? null : (
                      <button
                        type="button"
                        className="btn btn-success saveBtn"
                        onClick={(ev) => {
                          ev.preventDefault();
                          {
                            fileName === ""
                              ? null
                              : $("input[name=file_hash]").val(uploadImage());
                          }

                          if (ipfsHash !== "error") {
                            ajaxIOChain.then(
                              $.post(
                                tmplSubmissionUrl,
                                $("#editor-form").serialize(),
                                (resp) => {
                                  setErrors({});
                                  setPtId(resp.id);
                                  swal({
                                    title: "Done!",
                                    text: resp.success,
                                    type: "success",
                                    showConfirmButton: true,
                                    confirmButtonText: "Okay",
                                  });
                                },
                                "json"
                              ).fail(function (resp) {
                                var newerror = {};
                                if (resp.responseJSON.error) {
                                  newerror.form = [
                                    `Failed to save the ${tmplName}, please try again later`,
                                  ];
                                }
                                if (resp.responseJSON.release) {
                                  newerror.releaseTemp = [
                                    resp.responseJSON.release,
                                  ];
                                }
                                if (
                                  resp.responseJSON.error &&
                                  resp.responseJSON.error.scoreErr
                                ) {
                                  newerror.scoreTemp = [
                                    resp.responseJSON.error.scoreErr,
                                  ];
                                }
                                if (resp.responseJSON.error) {
                                  newerror.examStartDate =
                                    resp.responseJSON.error.examStartDate;
                                }
                                if (resp.responseJSON.error) {
                                  newerror.examEndDate =
                                    resp.responseJSON.error.examEndDate;
                                }

                                setErrors(newerror);
                                swal({
                                  title: `Failed to save the ${tmplName}.`,
                                  text: "Please check your submission.",
                                  type: "error",
                                  showConfirmButton: true,
                                  confirmButtonText: "Okay",
                                });
                              })
                            );
                          }
                        }}
                        title={
                          tmplValidityCheck
                            ? tmplValidityCheck
                            : "You can save this template."
                        }
                        disabled={tmplValidityCheck ? true : false}
                      >
                        {tmplName === "Course Structure"
                          ? "Save Course"
                          : "Save Template"}
                      </button>
                    )}{" "}
                    <a
                      href={tmplListUrl}
                      className="btn btn-primary waves-effect waves-light"
                    >
                      <i className="fa fa-arrow-left"></i>
                      &nbsp;Back
                    </a>
                    {errors.scoreTemp && (
                      <React.Fragment>
                        <br />
                        <br />
                        <span className="error invalid-feedback" role="alert">
                          <strong>{errors.scoreTemp[0]}</strong>
                        </span>
                      </React.Fragment>
                    )}
                    {tmplValidityCheck ? (
                      <React.Fragment>
                        <br />
                        <br />
                        <span className="error invalid-feedback" role="alert">
                          <strong>{tmplValidityCheck}</strong>
                        </span>
                      </React.Fragment>
                    ) : null}
                    {errors.form && (
                      <React.Fragment>
                        <br />
                        <br />
                        <span className="error invalid-feedback" role="alert">
                          <strong>{errors.form[0]}</strong>
                        </span>
                      </React.Fragment>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

EditorPanel.propTypes = {
  readOnly: PropTypes.bool.isRequired,
  itemType: PropTypes.string.isRequired,
  categoryType: PropTypes.string.isRequired,
  allTopics: PropTypes.array.isRequired,
  allExams: PropTypes.array,
  enableExamFilter: PropTypes.bool.isRequired,
  tmplListUrl: PropTypes.string.isRequired,
  addTopicUrl: PropTypes.string.isRequired,
  addExamUrl: PropTypes.string,
  itemViewUrlTemplate: PropTypes.string.isRequired,
  itemsListUrlTemplate: PropTypes.string.isRequired,
  csrfToken: PropTypes.string.isRequired,
  tmplSubmissionUrl: PropTypes.string.isRequired,
  charLimit: PropTypes.number.isRequired,
  instructions: PropTypes.string,
  name: PropTypes.string,
  AdditionalSettingsComponent: PropTypes.func,
  CustomHelperButtons: PropTypes.func,
  enableScore: PropTypes.bool.isRequired,
  genNewCategory: PropTypes.func.isRequired,
  isCategoryNameAvailable: PropTypes.func.isRequired,
  tmplName: PropTypes.string.isRequired,
  duplicateNameCheckUrlFmt: PropTypes.string.isRequired,
  customCategories: PropTypes.object,
  enableTimeLimit: PropTypes.bool.isRequired,
  enableNegativeMark: PropTypes.bool.isRequired,
};
