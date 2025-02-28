import { useState, useEffect, useContext } from "react";
import { useHistory } from "react-router-dom";
import { has, isArray } from "lodash";

import { toast } from "react-toastify";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { SocketContext } from "../../context/Socket/SocketContext";

import moment from "moment";
const useAuth = () => {
  const history = useHistory();
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({});

  const socketManager = useContext(SocketContext);

  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers["Authorization"] = `Bearer ${JSON.parse(token)}`;
        setIsAuth(true);
      }
      return config;
    },
    (error) => {
      Promise.reject(error);
    }
  );

  api.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;
      if (error?.response?.status === 403 && !originalRequest._retry) {
        originalRequest._retry = true;

        await refreshToken();
        return api(originalRequest);
      }
      if (error?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("companyId");
        api.defaults.headers.Authorization = undefined;
        setIsAuth(false);
      }
      return Promise.reject(error);
    }
  );

  async function refreshToken(){
    try {
      const { data } = await api.post("/auth/refresh_token");
      if (data) {
        localStorage.setItem("token", JSON.stringify(data.token));
        localStorage.setItem("companyId", data.user.companyId);
        localStorage.setItem("userId", data.user.id);
        api.defaults.headers.Authorization = `Bearer ${data.token}`;
        setUser(data.user);
        setIsAuth(true);
      }

    } catch (err) {
      toastError(err?.message);
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    (async () => {
      if (token) {
        await refreshToken();
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!socketManager){
        return () => {};
    }
    const companyId = localStorage.getItem("companyId");
    if (!companyId) {
		return () => {};
	}
    const socket = socketManager.GetSocket(companyId);

    const onCompanyUserUseAuth = (data) => {
      if (data.action === "update" && data.user.id === user.id) {
        setUser(data.user);
      }
    }

    socket.on(`company-${companyId}-user`, onCompanyUserUseAuth);

    return () => {
      socket.off(`company-${companyId}-user`, onCompanyUserUseAuth);
    };

  }, [user, socketManager]);

  const handleLogin = async (userData) => {
    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", userData);
      const {
        user: { companyId, id, company },
      } = data;

      if (has(company, "settings") && isArray(company.settings)) {
        const setting = company.settings.find(
          (s) => s.key === "campaignsEnabled"
        );
        if (setting && setting.value === "true") {
          localStorage.setItem("cshow", null); //regra pra exibir campanhas
        }
      }

      moment.locale('pt-br');
      const dueDate = data.user.company.dueDate;
      const hoje = moment(moment()).format("yyyy/MM/DD");
      const vencimento = moment(dueDate).format("yyyy//MM/DD");
      
      var diff = moment(dueDate).diff(moment(moment()).format());

      var before = moment(moment().format()).isBefore(dueDate);
      var dias = moment.duration(diff).asDays();
      var diasVenc = vencimento.valueOf() - hoje.valueOf()
      console.log("🚀 Console Log : diasVenc", diasVenc);

      if (before === true) {
        localStorage.setItem("token", JSON.stringify(data.token));
        localStorage.setItem("companyId", companyId);
        localStorage.setItem("userId", id);
        localStorage.setItem("companyDueDate", vencimento);
        api.defaults.headers.Authorization = `Bearer ${data.token}`;
        setUser(data.user);
        setIsAuth(true);
        toast.success(i18n.t("auth.toasts.success"));
        if (Math.round(dias) < 5) {
          toast.warn(`Sua assinatura vence em ${Math.round(dias)} ${Math.round(dias) === 1 ? 'dia' : 'dias'} `);
        }
        if (data.user.profile === "admin") {
          history.push("/");
        } else {
          history.push("/tickets");
        }
        setLoading(false);
      } else {
        
        toastError(`Opss! Sua assinatura venceu ${vencimento}.
Entre em contato com o Suporte para mais informações! `);
        setLoading(false);
      }

      //quebra linha 
    } catch (err) {

      toastError(err);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);

    try {
      await api.delete("/auth/logout");
      setIsAuth(false);
      setUser({});
      localStorage.removeItem("token");
      localStorage.removeItem("companyId");
      localStorage.removeItem("userId");
      localStorage.removeItem("cshow");
      api.defaults.headers.Authorization = undefined;
      setLoading(false);
      history.push("/login");
    } catch (err) {
      toastError(err?.message);
      setLoading(false);
    }
  };

  const getCurrentUserInfo = async () => {
    try {
      const { data } = await api.get("/auth/me");
      return data;
    } catch (_) {
      return null;
    }
  };

  return {
    isAuth,
    user,
    loading,
    handleLogin,
    handleLogout,
    getCurrentUserInfo,
  };
};

export default useAuth;