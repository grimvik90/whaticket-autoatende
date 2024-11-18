import React, { useState, useRef } from "react";

import Popover from "@mui/material/Popover";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import makeStyles from '@mui/styles/makeStyles';
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeDownIcon from "@mui/icons-material/VolumeDown";

import { Grid, Slider } from "@mui/material";

const useStyles = makeStyles((theme) => ({
    tabContainer: {
        padding: theme.spacing(2),
    },
    popoverPaper: {
        width: "100%",
        maxWidth: 350,
        marginLeft: theme.spacing(2),
        marginRight: theme.spacing(1),
        [theme.breakpoints.down('md')]: {
            maxWidth: 270,
        },
    },
    noShadow: {
        boxShadow: "none !important",
    },
    icons: {
        color: "#fff",
    },
    customBadge: {
        backgroundColor: "#f44336",
        color: "#fff",
    },
}));

const NotificationsVolume = ({ volume, setVolume }) => {
    const classes = useStyles();

    const anchorEl = useRef();
    const [isOpen, setIsOpen] = useState(false);

    const handleClick = () => {
        setIsOpen((prevState) => !prevState);
    };

    const handleClickAway = () => {
        setIsOpen(false);
    };

    const handleVolumeChange = (value) => {
        setVolume(value);
        localStorage.setItem("volume", value);
    };

    return <>
        <IconButton
            className={classes.icons}
            onClick={handleClick}
            ref={anchorEl}
            // color="inherit"
            // color="secondary"
            aria-label="Open Notifications"
            size="large">
            <VolumeUpIcon color="inherit" />
        </IconButton>
        <Popover
            disableScrollLock
            open={isOpen}
            anchorEl={anchorEl.current}
            anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
            }}
            transformOrigin={{
                vertical: "top",
                horizontal: "right",
            }}
            classes={{ paper: classes.popoverPaper }}
            onClose={handleClickAway}
        >
            <List dense className={classes.tabContainer}>
                <Grid container spacing={2}>
                    <Grid item>
                        <VolumeDownIcon />
                    </Grid>
                    <Grid item xs>
                        <Slider
                            value={volume}
                            aria-labelledby="continuous-slider"
                            step={0.1}
                            min={0}
                            max={1}
                            onChange={(e, value) =>
                                handleVolumeChange(value)
                            }
                        />
                    </Grid>
                    <Grid item>
                        <VolumeUpIcon />
                    </Grid>
                </Grid>
            </List>
        </Popover>
    </>;
};

export default NotificationsVolume;
