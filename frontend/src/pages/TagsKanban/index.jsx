import React, {
    useState,
    useEffect,
    useReducer,
    useCallback,
    useContext,
} from "react";
import {toast} from "react-toastify";

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
import {i18n} from "../../translate/i18n";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import TagModal from "../../components/TagModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import toastError from "../../errors/toastError";
import {Chip} from "@mui/material";

import {AuthContext} from "../../context/Auth/AuthContext";
import {SocketContext} from "../../context/Socket/SocketContext";


const reducer = (state, action) => {
    if (action.type === "LOAD_TAGS") {
        const tags = action.payload;
        const newTags = [];

        tags.forEach((tag) => {
            const tagIndex = state.findIndex((s) => s.id === tag.id);
            if (tagIndex !== -1) {
                state[tagIndex] = tag;
            } else {
                newTags.push(tag);
            }
        });

        return [...state, ...newTags];
    }

    if (action.type === "UPDATE_TAGS") {
        const tag = action.payload;
        const tagIndex = state.findIndex((s) => s.id === tag.id);

        if (tagIndex !== -1) {
            state[tagIndex] = tag;
            return [...state];
        } else {
            return [tag, ...state];
        }
    }

    if (action.type === "DELETE_TAG") {
        const tagId = action.payload;

        const tagIndex = state.findIndex((s) => s.id === tagId);
        if (tagIndex !== -1) {
            state.splice(tagIndex, 1);
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

const Tags = () => {
    const classes = useStyles();

    const {user} = useContext(AuthContext);

    const [loading, setLoading] = useState(false);
    const [pageNumber, setPageNumber] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [selectedTag, setSelectedTag] = useState(null);
    const [deletingTag, setDeletingTag] = useState(null);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [searchParam, setSearchParam] = useState("");
    const [tags, dispatch] = useReducer(reducer, []);
    const [tagModalOpen, setTagModalOpen] = useState(false);

    const fetchTags = useCallback(async () => {
        try {
            const {data} = await api.get("/tags/", {
                params: {searchParam, pageNumber, kanban: 1},
            });
            dispatch({type: "LOAD_TAGS", payload: data.tags});
            setHasMore(data.hasMore);
            setLoading(false);
        } catch (err) {
            toastError(err);
        }
    }, [searchParam, pageNumber]);

    useEffect(() => {
        dispatch({type: "RESET"});
        setPageNumber(1);
    }, [searchParam]);

    useEffect(() => {
        setLoading(true);
        const delayDebounceFn = setTimeout(() => {
            fetchTags();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchParam, pageNumber, fetchTags]);

    const socketManager = useContext(SocketContext);

    useEffect(() => {
        const socket = socketManager.GetSocket(user.companyId);

        socket.on(`company${user.companyId}-tag`, (data) => {
            if (data.action === "update" || data.action === "create") {
                dispatch({type: "UPDATE_TAGS", payload: data.tag});
            }

            if (data.action === "delete") {
                dispatch({type: "DELETE_TAG", payload: +data.tagId});
            }
        });

        return () => {
            socket.off(`company${user.companyId}-tag`);
        };
    }, [user, socketManager]);

    const handleOpenTagModal = () => {
        setSelectedTag(null);
        setTagModalOpen(true);
    };

    const handleCloseTagModal = () => {
        setSelectedTag(null);
        setTagModalOpen(false);
    };

    const handleSearch = (event) => {
        setSearchParam(event.target.value.toLowerCase());
    };

    const handleEditTag = (tag) => {
        setSelectedTag(tag);
        setTagModalOpen(true);
    };

    const handleDeleteTag = async (tagId) => {
        try {
            await api.delete(`/tags/${tagId}`);
            toast.success(i18n.t("tags.toasts.deleted"));
        } catch (err) {
            toastError(err);
        }
        setDeletingTag(null);
        setSearchParam("");
        setPageNumber(1);

        dispatch({type: "RESET"});
        setPageNumber(1);
        await fetchTags();
    };

    const loadMore = () => {
        setPageNumber((prevState) => prevState + 1);
    };

    const handleScroll = (e) => {
        if (!hasMore || loading) return;
        const {scrollTop, scrollHeight, clientHeight} = e.currentTarget;
        if (scrollHeight - (scrollTop + 100) < clientHeight) {
            loadMore();
        }
    };

    return (
        <MainContainer>
            <ConfirmationModal
                title={deletingTag && `${i18n.t("tagsKanban.confirmationModal.deleteTitle")}`}
                open={confirmModalOpen}
                onClose={setConfirmModalOpen}
                onConfirm={() => handleDeleteTag(deletingTag.id)}
            >
                {i18n.t("tagsKanban.confirmationModal.deleteMessage")}
            </ConfirmationModal>
            <TagModal
                open={tagModalOpen}
                onClose={handleCloseTagModal}
                reload={fetchTags}
                aria-labelledby="form-dialog-title"
                tagId={selectedTag && selectedTag.id}
                kanban={1}
            />
            <MainHeader>
                <Title>{i18n.t("tagsKanban.title")} ({tags.length})</Title>
                <MainHeaderButtonsWrapper>
                    <TextField
                        placeholder={i18n.t("contacts.searchPlaceholder")}
                        type="search"
                        value={searchParam}
                        onChange={handleSearch}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon style={{color: "gray"}}/>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleOpenTagModal}
                    >
                        {i18n.t("tagsKanban.buttons.add")}
                    </Button>
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
                            <TableCell align="center">{i18n.t("tagsKanban.table.name")}</TableCell>
                            <TableCell align="center">{i18n.t("tagsKanban.table.tickets")}</TableCell>
                            <TableCell align="center">{i18n.t("tagsKanban.table.actions")}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <>
                            {tags.map((tag) => (
                                <TableRow key={tag.id}>
                                    <TableCell align="center">
                                        <Chip
                                            variant="outlined"
                                            style={{
                                                backgroundColor: tag.color,
                                                textShadow: "1px 1px 1px #000",
                                                color: "white",
                                            }}
                                            label={tag.name}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="center">{tag?.ticketsCount ? (<span>{tag?.ticketsCount}</span>) :
                                        <span>0</span>}</TableCell>
                                    <TableCell align="center">
                                        <IconButton size="small" onClick={() => handleEditTag(tag)}>
                                            <EditIcon/>
                                        </IconButton>

                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                setConfirmModalOpen(true);
                                                setDeletingTag(tag);
                                            }}
                                        >
                                            <DeleteOutlineIcon/>
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {loading && <TableRowSkeleton columns={4}/>}
                        </>
                    </TableBody>
                </Table>
            </Paper>
        </MainContainer>
    );
};

export default Tags;