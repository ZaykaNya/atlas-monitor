/*
 * Copyright (c) 2020. This code created and belongs to Atlas render manager project.
 * Owner and project architect: Danil Andreev | danssg08@gmail.com |  https://github.com/DanilAndreev
 * Project: atlas-monitor
 * File last modified: 02.12.2020, 20:47
 * All rights reserved.
 */

import React, {Ref, useEffect, useState} from "react";
import {Button, Dialog, DialogTitle, List, ListItem, ListItemText, Paper, withStyles,} from "@material-ui/core";
import styles from "./styles";
import Stylable from "../../../../interfaces/Stylable";
import DialogTaskTabs from "../DialogTabs/DialogTaskTabs";
import {useTheme} from "@material-ui/core/styles";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";
import AppBar from "@material-ui/core/AppBar";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import SwipeableViews from "react-swipeable-views";
import useCoreRequest from "../../../../hooks/useCoreRequest";
import useEnqueueErrorSnackbar from "../../../../utils/enqueueErrorSnackbar";
import {Log} from "../../../../interfaces/Log";
import CoreEventDispatcher from "../../../../core/CoreEventDispatcher";
import {WS_RENDER_JOB_ATTEMPT_LOG_CREATE, WS_RENDER_JOB_UPDATE} from "../../../../globals";
import Loading from "../../../../components/Loading/Loading";
import LogField from "../../../../components/LogField";

interface DialogTaskLogsProps extends Stylable {
    open: boolean;
    taskId: number;

    onClose(): void;

}

interface TabPanelProps {
    children?: React.ReactNode;
    dir?: string;
    index: any;
    value: any;
}


function TabPanel(props: TabPanelProps) {
    const {children, value, index, ...other} = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`full-width-tabpanel-${index}`}
            aria-labelledby={`full-width-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box p={3}>
                    <Typography>{children}</Typography>
                </Box>
            )}
        </div>
    );
}


function a11yProps(index: any) {
    return {
        id: `full-width-tab-${index}`,
        "aria-controls": `full-width-tabpanel-${index}`,
    };
}


const DialogTaskLogs = React.forwardRef((props: DialogTaskLogsProps, ref: Ref<any>) => {
    const {
        classes,
        style,
        className,
        open,
        onClose,
        taskId
    } = props;


    const enqueueErrorSnackbar = useEnqueueErrorSnackbar();
    const coreRequest = useCoreRequest();
    const theme = useTheme();


    const [loaded, setLoaded] = useState(false);
    const [attemptsId, setAttemptsId] = useState(0);
    const [logs, setLogs] = useState<Log[]>([]);
    const [value, setValue] = React.useState(0);


    const refDiv = React.useRef<HTMLDivElement | null>(null);
    const refList = React.useRef<HTMLUListElement | null>(null);


    useEffect(() => {
        if (taskId !== 0) {
            const listener = (message: any) => {

                coreRequest()
                    .get(`attempts/${attemptsId}/log/${message.id}`)
                    .then(response => {
                        setLogs(prev => ([...prev, response.body]));
                    })
                    .catch(err => {
                        enqueueErrorSnackbar("Cant get log");
                    });

            };
            CoreEventDispatcher.getInstance().addListener(WS_RENDER_JOB_ATTEMPT_LOG_CREATE, listener);

            Promise.all([
                handleGetLogs(),
            ]).then(() => {
                setLoaded(true);
            });

            return () => {
                CoreEventDispatcher.getInstance().removeListener(WS_RENDER_JOB_ATTEMPT_LOG_CREATE, listener);
            };
        }
    }, [taskId]);

    useEffect(() => {
        window.addEventListener("scroll", handleChangeScroll);
        return () => window.removeEventListener("scroll", handleChangeScroll);
    }, []);

    //TODO make normal scrolling when you in the bottom of the screen
    useEffect(() => {
        if (refDiv.current && Visible(refDiv.current, refList.current)) {
            refDiv.current.scrollIntoView({behavior: "smooth"});
        }
    }, [logs]);


    async function handleGetLogs() {
        try {
            const attempts: any = await coreRequest().get(`tasks/${taskId}/attempts`);
            const firstAttemptId: any = attempts.body[0].id;
            setAttemptsId(attempts.body);
            const logs = await coreRequest().get(`attempts/${firstAttemptId}/log`);
            setLogs(logs.body);
        } catch (err) {
            enqueueErrorSnackbar("Cant get attempts");
        }
    }

    async function handleGetLogs2() {
        try {
            const attempts: any = await sendData();
            return attempts;
            // const lastAttemptId: any = attempts.body;
            // console.log(lastAttemptId);
            // const logs = await coreRequest().get(`attempts/${lastAttemptId}/log`);
            // return logs;
        } catch (err) {
            enqueueErrorSnackbar("Cant get attempts");
        }
    }

    async function sendData() {
        return [{message: "hahahihi", type: "info"}];
    }

    if(taskId !== 0) {
        handleGetLogs2().then(response => {
            console.log("kuku", response);
        })
    }


    const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
        setValue(newValue);
    };

    const handleChangeIndex = (index: number) => {
        setValue(index);
    };

    function handleChangeScroll() {

    }

    const handleCloseDialog = () => {
        setLogs([]);
        setLoaded(false);
        onClose();
    };

    let Visible = function (target: any, container: any) {

        // console.log(target.offsetTop - (container.scrollTop + container.offsetHeight));
        // console.log(refList);
        // console.log(window.pageYOffset, target.getBoundingClientRect().bottom);

        let targetPosition = {
                top: window.pageYOffset + target.getBoundingClientRect().top,
                bottom: window.pageYOffset + target.getBoundingClientRect().bottom
            },
            windowPosition = {
                top: window.pageYOffset,
                bottom: window.pageYOffset + document.documentElement.clientHeight
            };

        // console.log(targetPosition.top - 12, windowPosition.bottom);
        // console.log(target.offsetTop, (container.scrollTop + container.offsetHeight))

        if (target.offsetTop - (container.scrollTop + container.offsetHeight) < 0) {
            return true;
        }

        return targetPosition.top - 12 < windowPosition.bottom;
    };


    return (
        <Dialog
            open={open}
            onClose={handleCloseDialog}
            maxWidth={false}
            fullWidth
        >
            <DialogTitle className={classes.dialogTitle}>
                Task Logs
            </DialogTitle>

            <Box className={classes.root}>
                <AppBar position="static" color="default">
                    <Tabs
                        value={value}
                        onChange={handleChange}
                        indicatorColor="primary"
                        textColor="primary"
                        variant="fullWidth"
                        aria-label="full width tabs example"
                    >
                        <Tab label="Slave information" {...a11yProps(0)} />
                        <Tab label="Slave logs" {...a11yProps(1)} />
                    </Tabs>
                </AppBar>
                <SwipeableViews
                    axis={theme.direction === "rtl" ? "x-reverse" : "x"}
                    index={value}
                    onChangeIndex={handleChangeIndex}
                >
                    <TabPanel value={value} index={0} dir={theme.direction}>
                        <Box style={{height: 716}}>
                            {/*Slave information*/}
                            <LogField
                                handleGetLogs={handleGetLogs2}
                            />
                        </Box>
                    </TabPanel>
                    <TabPanel value={value} index={1} dir={theme.direction}>
                        {loaded ?
                            <List className={classes.dialogContainer} ref={refList}>
                                {logs.map((log, key) => {
                                    const logStrings = log.message.split("\n");
                                    let color = "white";
                                    switch (log.type) {
                                        case "info":
                                            color = "white";
                                            break;
                                        case "warning":
                                            color = "yellow";
                                            break;
                                        case "error":
                                            color = "red";
                                            break;
                                    }
                                    return logStrings.map((string: string, key: number) => {
                                        return (
                                            <React.Fragment>
                                                <ListItem className={classes.row}>
                                                    <Typography className={classes.rowText} style={{color: color}}>
                                                        {string}
                                                    </Typography>
                                                </ListItem>
                                            </React.Fragment>
                                        );
                                    });
                                })}
                                <div style={{height: 1}} id="target" ref={refDiv}/>
                            </List>
                            :
                            <Box className={classes.loading}>
                                <Loading/>
                            </Box>
                        }
                    </TabPanel>
                </SwipeableViews>
            </Box>

            <Button fullWidth onClick={() => sendData()}>
                Click
            </Button>

        </Dialog>
    );
});

export default withStyles(styles)(DialogTaskLogs);