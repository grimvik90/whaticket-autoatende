import React from "react";

import Paper from "@mui/material/Paper";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Skeleton from '@mui/material/Skeleton';

import makeStyles from '@mui/styles/makeStyles';
import { green, red } from '@mui/material/colors';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import moment from 'moment';

import Rating from '@mui/material/Rating';

const useStyles = makeStyles(theme => ({
	on: {
		color: green[600],
		fontSize: '20px'
	},
	off: {
		color: red[600],
		fontSize: '20px'
	},
    pointer: {
        cursor: "pointer"
    }
}));

export function RatingBox ({ rating }) {
    const ratingTrunc = rating === null ? 0 : Math.trunc(rating);
    return <Rating
        defaultValue={ratingTrunc}
        max={3}
        readOnly
    />
}

export default function TableAttendantsStatus(props) {
    const { loading, attendants } = props
	const classes = useStyles();

    function renderList () {
        return attendants.map((a, k) => (
            <TableRow key={k}>
                <TableCell>{a.name}</TableCell>
                <TableCell align="center" title="1 - Insatisfeito, 2 - Satisfeito, 3 - Muito Satisfeito" className={classes.pointer}>
                    <RatingBox rating={a.rating} />
                </TableCell>
                <TableCell align="center">{a.tickets}</TableCell>
                <TableCell align="center">{a.openCount}</TableCell>
                <TableCell align="center">{a.closeCount}</TableCell>
                <TableCell align="center">{formatTime(a.avgWaitTime, 2)}</TableCell>
                <TableCell align="center">{formatTime(a.avgSupportTime, 2)}</TableCell>
                <TableCell align="center">
                    { a.online ?
                        <CheckCircleIcon className={classes.on} />
                        : <ErrorIcon className={classes.off} />
                    }
                </TableCell>
            </TableRow>
        ))
    }

	function formatTime(minutes){
		return moment().startOf('day').add(minutes, 'minutes').format('HH[h] mm[m]');
	}

    return !loading ?
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Nome</TableCell>
                        <TableCell align="center">Avaliações</TableCell>
                        <TableCell align="center">Total de Atendimentos</TableCell>
                        <TableCell align="center">Acontecendo</TableCell>
                        <TableCell align="center">Finalizados</TableCell>
                        <TableCell align="center">T.M. de Espera</TableCell>
                        <TableCell align="center">T.M. de Atendimento</TableCell>
                        <TableCell align="center">Status (Atual)</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    { renderList() }
                </TableBody>
            </Table>
        </TableContainer>
        : <Skeleton variant="rectangular" height={150} />;
}