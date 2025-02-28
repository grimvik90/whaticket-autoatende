import React, { useState, useEffect, useReducer, useContext } from "react";
import { toast } from "react-toastify";
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
import UserStatusIcon from "../../components/UserModal/statusIcon";
import { WhatsApp } from "@mui/icons-material";
import EditIcon from "@mui/icons-material/Edit";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import UserModal from "../../components/UserModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import toastError from "../../errors/toastError";
import { SocketContext } from "../../context/Socket/SocketContext";
const reducer = (state, action) => {
  if (action.type === "LOAD_USERS") {
    const users = action.payload;
    const newUsers = [];
    users.forEach((user) => {
      const userIndex = state.findIndex((u) => u.id === user.id);
      if (userIndex !== -1) {
        state[userIndex] = user;
      } else {
        newUsers.push(user);
      }
    });
    return [...state, ...newUsers];
  }
  if (action.type === "UPDATE_USERS") {
    const user = action.payload;
    const userIndex = state.findIndex((u) => u.id === user.id);
    if (userIndex !== -1) {
      state[userIndex] = user;
      return [...state];
    } else {
      return [user, ...state];
    }
  }
  if (action.type === "DELETE_USER") {
    const userId = action.payload;
    const userIndex = state.findIndex((u) => u.id === userId);
    if (userIndex !== -1) {
      state.splice(userIndex, 1);
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
  onlineUsers: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    backgroundColor: "green", // Cor da sua bolinha
    display: "inline-block",
    marginRight: theme.spacing(1.5), // Ajuste conforme necessário
    animation: "$fa-blink .75s linear infinite",
  },
  offlineUsers: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    backgroundColor: "red", // Cor da sua bolinha
    display: "inline-block",
    marginRight: theme.spacing(1.5), // Ajuste conforme necessário
    animation: "$fa-blink .75s linear infinite",
  },
  '@keyframes fa-blink': {
    '0%': { opacity: 1 },
    '50%': { opacity: 0.5 },
    '100%': { opacity: 0 },
  },
}));
const Users = () => {
  const classes = useStyles();
  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [users, dispatch] = useReducer(reducer, []);  
  const [usersOnline, setUsersOnline] = useState(0);
  const [usersOffline, setUsersOffline] = useState(0);

  const socketManager = useContext(SocketContext);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);
  useEffect(()=>{
    const fetchUsersOn = async () => {
      try {
        const { data } = await api.get("/users/", {
          params: { searchParam, pageNumber },
        });
        setUsersOnline(data?.onlineCount);
        setUsersOffline(data?.offlineCount);
      } catch (err) {
        toastError(err);
      }
    };
   fetchUsersOn()
})
  useEffect(async () => {
    setLoading(true);
    try {
      const {data} = await api.get("/users/", {
        params: {searchParam, pageNumber},
      });
      dispatch({type: "LOAD_USERS", payload: data.users});
      setUsersOnline(data?.onlineCount)
      setUsersOffline(data?.offlineCount)
      setHasMore(data.hasMore);
      setLoading(false);
    } catch (err) {
      toastError(err);
    }
  }, [searchParam, pageNumber]);
  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.GetSocket(companyId);

    const onCompanyUser = (data) => {
      if (data.action === "update" || data.action === "create") {
        dispatch({ type: "UPDATE_USERS", payload: data.user });
      }

      if (data.action === "delete") {
        dispatch({ type: "DELETE_USER", payload: +data.userId });
      }
    }

    socket.on(`company-${companyId}-user`, onCompanyUser);

    return () => {
      socket.off(`company-${companyId}-user`)
    };
  }, []);
  const handleOpenUserModal = () => {
    setSelectedUser(null);
    setUserModalOpen(true);
  };
  const handleCloseUserModal = () => {
    setSelectedUser(null);
    setUserModalOpen(false);
  };
  const handleSearch = (event) => {
    setSearchParam(event.target.value.toLowerCase());
  };
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setUserModalOpen(true);
  };
  const handleDeleteUser = async (userId) => {
    try {
      await api.delete(`/users/${userId}`);
      toast.success(i18n.t("users.toasts.deleted"));
    } catch (err) {
      toastError(err);
    }
    setDeletingUser(null);
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
  return (
    <MainContainer>
      <ConfirmationModal
        title={
          deletingUser &&
          `${i18n.t("users.confirmationModal.deleteTitle")} ${
            deletingUser.name
          }?`
        }
        open={confirmModalOpen}
        onClose={setConfirmModalOpen}
        onConfirm={() => handleDeleteUser(deletingUser.id)}
      >
        {i18n.t("users.confirmationModal.deleteMessage")}
      </ConfirmationModal>
      <UserModal
        open={userModalOpen}
        onClose={handleCloseUserModal}
        aria-labelledby="form-dialog-title"
        userId={selectedUser && selectedUser.id}
      />
      <MainHeader>
      <div>
          <Title>{i18n.t("users.title")}</Title>
          <div>
            <span className={classes.onlineUsers}></span>
            {i18n.t("users.status.online")}:{usersOnline}
          </div>
          <div>
            <span className={classes.offlineUsers}></span>
            {i18n.t("users.status.offline")}:{usersOffline}
          </div>
        </div>
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
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenUserModal}
          >
            {i18n.t("users.buttons.add")}
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
              <TableCell align="center">{i18n.t("users.table.id")}</TableCell>
              <TableCell align="center">{i18n.t("users.table.status")}</TableCell>
              <TableCell align="center">{i18n.t("users.table.name")}</TableCell>
              <TableCell align="center">{i18n.t("users.table.email")}</TableCell>
              <TableCell align="center">{i18n.t("users.table.profile")}</TableCell>
              <TableCell align="center">{i18n.t("users.table.whatsapp")}</TableCell>
              <TableCell align="center">{i18n.t("users.table.startWork")}</TableCell>
              <TableCell align="center">{i18n.t("users.table.endWork")}</TableCell>
              <TableCell align="center">{i18n.t("users.table.actions")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell align="center">{user.id}</TableCell>
                  <TableCell align="center"><UserStatusIcon user={user} /></TableCell>
                  <TableCell align="center">{user.name}</TableCell>
                  <TableCell align="center">{user.email}</TableCell>
                  <TableCell align="center">{user.profile}</TableCell>
                  <TableCell align="center">{user.whatsapp?.name}</TableCell>
                  <TableCell align="center">{user.startWork}</TableCell>
                  <TableCell align="center">{user.endWork}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleEditUser(user)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        setConfirmModalOpen(true);
                        setDeletingUser(user);
                      }}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {loading && <TableRowSkeleton columns={8} />}
            </>
          </TableBody>
        </Table>
      </Paper>
    </MainContainer>
  );
};
export default Users;