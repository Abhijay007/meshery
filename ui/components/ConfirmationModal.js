import {
  Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Tab, Tabs, TextField,
  Tooltip, Typography
} from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import { withStyles } from "@material-ui/core/styles";
import { Search } from "@material-ui/icons";
import { withSnackbar } from "notistack";
import { connect } from "react-redux";
import { setK8sContexts, updateProgress } from "../lib/store";
import { closeButtonForSnackbarAction, errorHandlerGenerator, successHandlerGenerator } from "./ConnectionWizard/helpers/common";
import { pingKubernetes } from "./ConnectionWizard/helpers/kubernetesHelpers";
import { getK8sConfigIdsFromK8sConfig } from "../utils/multi-ctx";
import { bindActionCreators } from "redux";
import { useEffect, useState } from "react";
import UndeployIcon from "../public/static/img/UndeployIcon";
import DoneAllIcon from '@material-ui/icons/DoneAll';
import AddIcon from '@material-ui/icons/Add';
import DoneIcon from "@material-ui/icons/Done";
import Link from 'next/link';
import Operator from "../assets/img/Operator";

const styles = (theme) => ({
  dialogBox : {
    // maxHeight : "42rem"
  },
  icon : {
    display : 'inline',
    verticalAlign : 'text-top',
    width : theme.spacing(1.75),
    marginLeft : theme.spacing(0.5),
  },
  chip : {
    height : "50px",
    fontSize : "15px",
    position : "relative",
    top : theme.spacing(0.5),
    [theme.breakpoints.down("md")] : { fontSize : "12px", },
  },

  ctxChip : {
    backgroundColor : "white",
    cursor : "pointer",
    marginRight : theme.spacing(1),
    marginLeft : theme.spacing(1),
    marginBottom : theme.spacing(1),
    height : "100%",
    padding : theme.spacing(0.5)
  },
  ctxIcon : {
    display : 'inline',
    verticalAlign : 'text-top',
    width : theme.spacing(2.5),
    marginLeft : theme.spacing(0.5),
  },
  title : {
    textAlign : 'center',
    // minWidth : 300,
    padding : theme.spacing(1),
    color : '#fff',
    backgroundColor : 'rgb(57, 102, 121)',
    fontSize : "1rem",

  },
  subtitle : {
    minWidth : 400,
    overflowWrap : 'anywhere',
    textAlign : 'center',
    padding : '5px'
  },
  button : {
    margin : theme.spacing(0.5),
    padding : theme.spacing(1),
    borderRadius : 5,
    minWidth : 100,
    color : "#fff",
    "&:hover" : {
      boxShadow : "0px 2px 4px -1px rgb(0 0 0 / 20%), 0px 4px 5px 0px rgb(0 0 0 / 14%), 0px 1px 10px 0px rgb(0 0 0 / 12%)"
    },
  },
  undeployBtn : {
    margin : theme.spacing(0.5),
    padding : theme.spacing(1),
    borderRadius : 5,
    backgroundColor : "#B32700",
    "&:hover" : {
      backgroundColor : "#8f1f00",
      boxShadow : "0px 2px 4px -1px rgb(0 0 0 / 20%), 0px 4px 5px 0px rgb(0 0 0 / 14%), 0px 1px 10px 0px rgb(0 0 0 / 12%)"
    },
    minWidth : 100,
  },
  disabledBtnDel : {
    margin : theme.spacing(0.5),
    padding : theme.spacing(1),
    borderRadius : 5,
    "&:disabled" : {
      backgroundColor : "#FF3D3D",
      color : "#fff"
    },
    minWidth : 100,
  },
  actions : {
    display : 'flex',
    justifyContent : 'space-evenly',
    marginTop : theme.spacing(-3)
  },
  all : {
    display : "table"
  },
  contexts : {
    display : "flex",
    flexWrap : "wrap"
  },
  tabs : {
    marginLeft : 0
  },
  tabLabel : {
    tabLabel : {
      [theme.breakpoints.up("sm")] : {
        fontSize : '1em'
      },
      [theme.breakpoints.between("xs", 'sm')] : {
        fontSize : '0.8em'
      }
    }
  },
  AddIcon : {
    width : theme.spacing(2.5),
    paddingRight : theme.spacing(0.5),
  },
  statsWrapper : {
    maxWidth : "100%",
    height : 'auto',
    borderTopLeftRadius : 0,
    borderTopRightRadius : 0,
    borderBottomLeftRadius : 3,
    borderBottomRightRadius : 3,
  },
  paperRoot : {
    flexGrow : 1,
    maxWidth : "100%",
    marginLeft : 0,
    borderTopLeftRadius : 3,
    borderTopRightRadius : 3,
  },
  text : {
    display : "flex",
    justifyContent : "center"
  },
  textContent : {
    display : "flex",
    flexDirection : "column",
    alignItems : "center",
    justifyContent : "center",
    marginTop : "1rem",
    backgroundColor : "rgb(234, 235, 236)",
    padding : "10px",
    borderRadius : "10px"
  },
  subText : {
    color : "rgba(84, 87, 91, 1)",
    fontSize : "16px"
  },
})

const ACTIONS = {
  DEPLOY : 0,
  UNDEPLOY : 1,
  VERIFY : 2
};

function ConfirmationMsg(props) {
  const { classes, open, handleClose, submit,
    selectedK8sContexts, k8scontext, title, validationBody, setK8sContexts, enqueueSnackbar, closeSnackbar, componentCount, tab, isVerify } = props

  const [tabVal, setTabVal] = useState(tab);
  const [disabled, setDisabled] = useState(true);
  const [context,setContexts]=useState([]);
  let isDisabled = typeof selectedK8sContexts.length === "undefined" || selectedK8sContexts.length === 0

  useEffect(() => {
    setTabVal(tab);
    setContexts(k8scontext);
  },[open])

  useEffect(() => {
    setDisabled(isDisabled);
  },[selectedK8sContexts]);

  const handleTabValChange = (event, newVal) => {
    setTabVal(newVal);
  }

  const handleKubernetesClick = (ctxID) => {
    updateProgress({ showProgress : true })
    pingKubernetes(
      successHandlerGenerator(enqueueSnackbar, closeButtonForSnackbarAction(closeSnackbar), "Kubernetes succesfully pinged", () => updateProgress({ showProgress : false })),
      errorHandlerGenerator(enqueueSnackbar, closeButtonForSnackbarAction(closeSnackbar), "Kubernetes not pinged successfully", () => updateProgress({ showProgress : false })),
      ctxID
    )
  }

  const handleSubmit = () => {
    if (selectedK8sContexts.length === 0) {
      enqueueSnackbar("Please select Kubernetes context(s) before proceeding with the operation",
        {
          variant : "info", preventDuplicate : true,
          action : (key) => (
            <IconButton key="close" aria-label="Close" color="inherit" onClick={() => closeSnackbar(key)}>
              <CloseIcon />
            </IconButton>
          ),
          autoHideDuration : 3000,
        });
    }

    if (tabVal === 0) {
      submit.deploy();
    } else {
      submit.unDeploy();
    }
    handleClose();
  }

  const searchContexts = (search) => {
    if (search === "") {
      setK8sContexts(k8scontext);
    }
    let matchedCtx = [];
    k8scontext.forEach(ctx => {
      if (ctx.contextName.includes(search)) {
        matchedCtx.push(ctx);
      }
    });
    setK8sContexts(matchedCtx);
  }

  const setContextViewer = (id) => {
    if (id === "all") {
      if (selectedK8sContexts.includes("all")) {
        updateProgress({ showProgress : true })
        setK8sContexts({ selectedK8sContexts : [] })
      } else {
        setK8sContexts({ selectedK8sContexts : ["all"] });
      }
      return;
    }

    if (selectedK8sContexts.includes(id)) {
      const filteredContexts = selectedK8sContexts.filter(cid => cid !== id);
      setK8sContexts({ selectedK8sContexts : filteredContexts })
    } else if (selectedK8sContexts[0] === "all") {
      const allContextIds = getK8sConfigIdsFromK8sConfig(k8scontext);
      setK8sContexts({ selectedK8sContexts : allContextIds.filter(cid => cid !== id) });
    } else {
      if (selectedK8sContexts.length === k8scontext.length - 1) {
        setK8sContexts({ selectedK8sContexts : ["all"] })
        return;
      }
      setK8sContexts({ selectedK8sContexts : [...selectedK8sContexts, id] });
    }
  }
  return (
    <div className={classes.root}>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        className={classes.dialogBox}
      >
        <>
          <DialogTitle id="alert-dialog-title" className={classes.title}>
            {title}
          </DialogTitle>
          {/* <Paper square className={classes.paperRoot}> */}
          <Tabs
            value={tabVal}
            onChange={handleTabValChange}
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
            className={classes.tabs}
          >
            <Tab
              className={classes.tab}
              label={<div style={{ display : "flex" }}> <DoneAllIcon style={{ margin : "2px" }} fontSize="small" /> <span className={classes.tabLabel}>Deploy</span> </div>}
            />
            <Tab
              className={classes.tab}
              label={<div style={{ display : "flex" }}> <div style={{ margin : "2px" }}> <UndeployIcon fill="rgba(0, 0, 0, 0.54)" width="20" height="20"/> </div> <span className={classes.tabLabel}>Undeploy</span> </div>}
            />
            {isVerify &&
              <Tab
                className={classes.tab}
                label={<div style={{ display : "flex" }}> <DoneIcon style={{ margin : "2px" }}  fontSize="small"/><span className={classes.tabLabel}>Validate</span> </div>
                }
              />}
          </Tabs>
          {/* </Paper>
          <Paper className={classes.statsWrapper}> */}
          {(tabVal === ACTIONS.DEPLOY || tabVal === ACTIONS.UNDEPLOY) &&
              <DialogContent>
                <DialogContentText id="alert-dialog-description" className={classes.subtitle}>
                  <Typography variant="subtitle1" style={{ marginBottom : "0.8rem" }}> {componentCount !== undefined ? <> {componentCount} component{componentCount > 1 ? "s" : ""} </> : "" }</Typography>
                  {
                    k8scontext.length > 0 ?
                      <Typography variant="body1">
                        <TextField
                          id="search-ctx"
                          label="Search"
                          size="small"
                          variant="outlined"
                          onChange={(event) => searchContexts(event.target.value)}
                          style={{ width : "100%", backgroundColor : "rgba(102, 102, 102, 0.12)", margin : "1px 1px 8px " }}
                          InputProps={{
                            endAdornment : (
                              <Search />
                            )
                          }}
                        // margin="none"
                        />
                        {context.length > 0?
                          <div className={classes.all}>
                            <Checkbox
                              checked={selectedK8sContexts?.includes("all")}
                              onChange={() => setContextViewer("all")}
                              color="primary"
                            />
                            <span style={{ fontWeight : "bolder" }}>select all</span>
                          </div>
                          :
                          <Typography variant="subtitle1">
                          No Context found
                          </Typography>
                        }

                        <div className={classes.contexts}>
                          {
                            context.map((ctx) => (
                              <div id={ctx.contextID} className={classes.chip}>
                                <Tooltip title={`Server: ${ctx.configuredServer}`}>
                                  <div style={{ display : "flex", justifyContent : "flex-wrap", alignItems : "center" }}>
                                    <Checkbox
                                      checked={selectedK8sContexts.includes(ctx.contextID) || (selectedK8sContexts.length > 0 && selectedK8sContexts[0] === "all")}
                                      onChange={() => setContextViewer(ctx.contextID)}
                                      color="primary"
                                    />
                                    <Chip
                                      label={ctx.contextName}
                                      className={classes.ctxChip}
                                      onClick={() => handleKubernetesClick(ctx.contextID)}
                                      icon={<img src="/static/img/kubernetes.svg" className={classes.ctxIcon} />}
                                      variant="outlined"
                                      data-cy="chipContextName"
                                    />
                                  </div>

                                </Tooltip>
                              </div>
                            ))
                          }
                        </div>
                      </Typography>
                      :
                      <div className={classes.textContent}>
                        <Operator />
                        <Typography variant="h5">No cluster connected yet</Typography>

                        <Link href="/settings">
                          <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            style={{ margin : "0.6rem 0.6rem", whiteSpace : "nowrap" }}
                          >
                            <AddIcon className={classes.AddIcon} />
                          Connect Clusters
                          </Button>
                        </Link>
                      </div>
                  }
                </DialogContentText>
              </DialogContent>
          }
          {tabVal === ACTIONS.VERIFY &&// Validate
              <DialogContent>
                <DialogContentText>
                  { validationBody }
                </DialogContentText>
              </DialogContent>
          }
          {/* </Paper> */}

          <DialogActions className={classes.actions}>
            { (tabVal == ACTIONS.DEPLOY || tabVal === ACTIONS.UNDEPLOY) ?
              <>
                <Button onClick={handleClose}
                  type="submit"
                  variant="contained"
                >
                  <Typography variant body2 > CANCEL </Typography>
                </Button>
                <Button disabled
                  className={tabVal === ACTIONS.UNDEPLOY ? classes.disabledBtnDel : "" }
                  type="submit"
                  variant="contained"
                  color="primary">
                  <Typography variant body2 > {tabVal === ACTIONS.UNDEPLOY ? "UNDEPLOY LATER" : "DEPLOY LATER"} </Typography>
                  {/* colorchange  */}
                </Button>
                <Button onClick={handleSubmit}
                  className={isDisabled ? (tabVal === ACTIONS.UNDEPLOY ? classes.disabledBtnDel : classes.button) : tabVal === ACTIONS.UNDEPLOY ? classes.undeployBtn : classes.button}
                  autoFocus
                  type="submit"
                  variant="contained"
                  color="primary"
                  data-cy="deploy-btn-confirm"
                  disabled={disabled}
                >
                  <Typography variant body2 > {tabVal === ACTIONS.UNDEPLOY ? "UNDEPLOY" : "DEPLOY"} </Typography>
                </Button>
              </>
              :
              <Button onClick={handleClose}
                className={classes.button} autoFocus type="submit"
                variant="contained"
                color="primary"
              >
                <Typography variant body2 > OK </Typography>
              </Button>
            }
          </DialogActions>
        </>
      </Dialog>
    </div>
  )
}

const mapStateToProps = state => {
  const selectedK8sContexts = state.get('selectedK8sContexts');
  const k8scontext = state.get("k8sConfig");
  return { selectedK8sContexts : selectedK8sContexts, k8scontext : k8scontext };
}

const mapDispatchToProps = (dispatch) => ({
  updateProgress : bindActionCreators(updateProgress, dispatch),
  setK8sContexts : bindActionCreators(setK8sContexts, dispatch)
});

export default withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(withSnackbar(ConfirmationMsg)));
