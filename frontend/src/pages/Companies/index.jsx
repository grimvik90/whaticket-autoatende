import React, { useState, useEffect, useReducer, useContext } from "react";
import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";
import { SocketContext } from "../../context/Socket/SocketContext";

import makeStyles from '@mui/styles/makeStyles';
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";

import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import CompanyModal from "../../components/CompaniesModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { useDate } from "../../hooks/useDate";
import { formatFolderSize } from "../../utils/formatFolderSize";
import moment from "moment";

const reducer = (state, action) => {
    if (action.type === "LOAD_COMPANIES") {
        const companies = action.payload;
        const newCompanies = [];

        companies.forEach((company) => {
            const companyIndex = state.findIndex((u) => u.id === company.id);
            if (companyIndex !== -1) {
                state[companyIndex] = company;
            } else {
                newCompanies.push(company);
            }
        });

        return [...state, ...newCompanies];
    }

    if (action.type === "UPDATE_COMPANIES") {
        const company = action.payload;
        const companyIndex = state.findIndex((u) => u.id === company.id);

        if (companyIndex !== -1) {
            state[companyIndex] = company;
            return [...state];
        } else {
            return [company, ...state];
        }
    }

    if (action.type === "DELETE_COMPANIES") {
        const companyId = action.payload;

        const companyIndex = state.findIndex((u) => u.id === companyId);
        if (companyIndex !== -1) {
            state.splice(companyIndex, 1);
        }
        return [...state];
    }

    if (action.type === "RESET") {
        return [];
    }
};

const useStyles = makeStyles((theme) => ({
    mainPaper: {
        flex: 1,
        padding: theme.spacing(1),
        overflowY: "scroll",
        ...theme.scrollbarStyles,
    },
}));

const Companies = () => {
    const classes = useStyles();
    const history = useHistory();

    const [loading, setLoading] = useState(false);
    const [pageNumber, setPageNumber] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [deletingCompany, setDeletingCompany] = useState(null);
    const [companyModalOpen, setCompanyModalOpen] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [searchParam, setSearchParam] = useState("");
    const [companies, dispatch] = useReducer(reducer, []);
    const { dateToClient, datetimeToClient } = useDate();

    const { user } = useContext(AuthContext);


    useEffect(() => {
        async function fetchData() {
            if (!user.super) {
                toast.error("Esta empresa não possui permissão para acessar essa página! Estamos lhe redirecionando.");
                setTimeout(() => {
                    history.push(`/`)
                }, 1000);
            }
        }
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        dispatch({ type: "RESET" });
        setPageNumber(1);
    }, [searchParam]);

    useEffect(async () => {
        setLoading(true);
        await fetchCompanies();

    }, [searchParam, pageNumber]);


    const fetchCompanies = async () => {
        try {
            const { data } = await api.get("/companiesPlan/", {
                params: { searchParam, pageNumber },
            });
            dispatch({ type: "LOAD_COMPANIES", payload: data.companies });
            setHasMore(data.hasMore);
            setLoading(false);
        } catch (err) {
            toastError(err);
        }
    };


    const handleOpenCompanyModal = () => {
        setSelectedCompany(null);
        setCompanyModalOpen(true);
    };

    const handleCloseCompanyModal = () => {
        setSelectedCompany(null);
        setCompanyModalOpen(false);
        fetchCompanies();
    };

    const handleSearch = (event) => {
        setSearchParam(event.target.value.toLowerCase());
    };

    const handleEditCompany = (company) => {
        setSelectedCompany(company);
        setCompanyModalOpen(true);
    };

    const handleDeleteCompany = async (companyId) => {
        try {
            await api.delete(`/companies/${companyId}`);
            toast.success(i18n.t("compaies.toasts.deleted"));

            // Despacha a ação de exclusão para atualizar o estado
            dispatch({ type: "DELETE_COMPANIES", payload: companyId });

            fetchCompanies();
        } catch (err) {
            toastError(err);
        }
        setDeletingCompany(null);
        setSearchParam("");
        setPageNumber(1);
    };

    const loadMore = () => {
        setPageNumber((prevState) => prevState + 1);
    };

    const handleScroll = (e) => {
        if (!hasMore || loading) return;
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - (scrollTop + 100) < clientHeight) {
            loadMore();
        }
    };

    const renderStatus = (row) => {
        return row.status === false ? "Não" : "Sim";
    };

    const renderPlanValue = (row) => {
        return row.planId !== null ? row.plan.value ? row.plan.value.toLocaleString('pt-br', { minimumFractionDigits: 2 }) : '00.00' : "-";
    };

    const rowStyle = (record) => {
        if (moment(record.dueDate).isValid()) {
            const now = moment();
            const dueDate = moment(record.dueDate);
            const diff = dueDate.diff(now, "days");
            if (diff >= 1 && diff <= 5) {
                return { backgroundColor: "#fffead" };
            }
            if (diff <= 0) {
                return { backgroundColor: "#fa8c8c" };
            }
            else {
                return { backgroundColor: "#affa8c" };
            }
        }
        return {};
    };

    return (
        <MainContainer>
            <ConfirmationModal
                title={
                    deletingCompany &&
                    `${i18n.t("compaies.confirmationModal.deleteTitle")} ${deletingCompany.name}?`
                }
                open={confirmModalOpen}
                onClose={setConfirmModalOpen}
                onConfirm={() => handleDeleteCompany(deletingCompany.id)}
            >
                {i18n.t("compaies.confirmationModal.deleteMessage")}
            </ConfirmationModal>
            <CompanyModal
                open={companyModalOpen}
                onClose={handleCloseCompanyModal}
                aria-labelledby="form-dialog-title"
                companyId={selectedCompany && selectedCompany.id}
            />
            <MainHeader>
                <Title>{i18n.t("compaies.title.main")} ({companies.length})</Title>
                <MainHeaderButtonsWrapper>
                    <TextField
                        placeholder={i18n.t("contacts.searchPlaceholder")}
                        type="search"
                        value={searchParam}
                        onChange={handleSearch}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon style={{ color: "gray" }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                    {/*<Button
                        variant="contained"
                        color="primary"
                        onClick={handleOpenCompanyModal}
                    >
                        {i18n.t("compaies.buttons.add")}
                    </Button>*/}
                </MainHeaderButtonsWrapper>
            </MainHeader>
            <Paper
                className={classes.mainPaper}
                variant="outlined"
                onScroll={handleScroll}
            >
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell align="center">{i18n.t("compaies.table.id")}</TableCell>
                            <TableCell align="center">{i18n.t("compaies.table.status")}</TableCell>
                            <TableCell align="center">{i18n.t("compaies.table.name")}</TableCell>
                            <TableCell align="center">{i18n.t("compaies.table.email")}</TableCell>
                            <TableCell align="center">{i18n.t("compaies.table.namePlan")}</TableCell>
                            <TableCell align="center">{i18n.t("compaies.table.value")}</TableCell>
                            <TableCell align="center">{i18n.t("compaies.table.createdAt")}</TableCell>
                            <TableCell align="center">{i18n.t("compaies.table.dueDate")}</TableCell>
                            <TableCell align="center">{i18n.t("compaies.table.lastLogin")}</TableCell>
                            <TableCell align="center">{i18n.t("compaies.table.folderSize")}</TableCell>
                            <TableCell align="center">{i18n.t("compaies.table.numberOfFiles")}</TableCell>
                            <TableCell align="center">{i18n.t("compaies.table.lastUpdate")}</TableCell>
                            <TableCell align="center">{i18n.t("compaies.table.actions")}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <>
                            {companies.map((company) => (
                                <TableRow style={rowStyle(company)} key={company.id}>
                                    <TableCell align="center">{company.id}</TableCell>
                                    <TableCell align="center">{renderStatus(company.status)}</TableCell>
                                    <TableCell align="center">{company.name}</TableCell>
                                    <TableCell align="center">{company.email}</TableCell>
                                    <TableCell align="center">{company.plan?.name || "Sem plano"}</TableCell>
                                    <TableCell align="center">R$ {renderPlanValue(company)}</TableCell>
                                    <TableCell align="center">{dateToClient(company.createdAt)}</TableCell>
                                    <TableCell align="center">{dateToClient(company.dueDate)}<br /><span>{company.recurrence}</span></TableCell>
                                    <TableCell align="center">{datetimeToClient(company.lastLogin)}</TableCell>
                                    <TableCell align="center">{formatFolderSize(company.metrics.folderSize)}</TableCell>
                                    <TableCell align="center">{company.metrics.numberOfFiles}</TableCell>
                                    <TableCell align="center">{company.metrics.lastUpdate}</TableCell>
                                    <TableCell align="center">
                                        {/*<IconButton
                                            size="small"
                                            onClick={() => handleEditCompany(company)}
                                        >
                                            <EditIcon />
                                        </IconButton>*/}

                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                setConfirmModalOpen(true);
                                                setDeletingCompany(company);
                                            }}
                                        >
                                            <DeleteOutlineIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {loading && <TableRowSkeleton columns={4} />}
                        </>
                    </TableBody>
                </Table>
            </Paper>
        </MainContainer>
    );
};

export default Companies;
