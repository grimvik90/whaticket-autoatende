import React from "react";
import makeStyles from '@mui/styles/makeStyles';
import { green, red } from '@mui/material/colors';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

const useStyles = makeStyles(theme => ({
    on: {
        color: green[600],
        fontSize: '20px'
    },
    off: {
        color: red[600],
        fontSize: '20px'
    }
}));

const UserStatusIcon = ({ user }) => {
    const classes = useStyles();
    return user.online ?
        <CheckCircleIcon className={classes.on} />
        : <ErrorIcon className={classes.off} />
}

export default UserStatusIcon;