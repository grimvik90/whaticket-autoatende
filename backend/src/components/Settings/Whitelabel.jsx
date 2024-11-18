import React, {useEffect, useState, useContext, useRef} from "react";

import Grid from "@mui/material/Grid";
import FormControl from "@mui/material/FormControl";
import TextField from "@mui/material/TextField";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import FormHelperText from "@mui/material/FormHelperText";
import Title from "../Title";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { TwitterPicker } from 'react-color';
import useSettings from "../../hooks/useSettings";
import {toast} from 'react-toastify';
import makeStyles from '@mui/styles/makeStyles';
import {grey, blue} from "@mui/material/colors";
import OnlyForSuperUser from "../OnlyForSuperUser";
import useAuth from "../../hooks/useAuth.js";

import {
    IconButton,
    InputAdornment,
} from "@mui/material";

import {Colorize, AttachFile, Delete} from "@mui/icons-material";
import ColorModeContext from "../../layout/themeContext";
import api from "../../services/api";

const defaultLogoLight = "assets/vector/logo.svg";
const defaultLogoDark = "assets/vector/logo-dark.svg";
const defaultLogoFavicon = "assets/vector/favicon.svg";
const defaultLogoPWAicon = "assets/vector/pwaicon.svg";

const useStyles = makeStyles((theme) => ({
    container: {
        paddingTop: theme.spacing(4),
        paddingBottom: theme.spacing(4),
    },

    fixedHeightPaper: {
        padding: theme.spacing(2),
        display: "flex",
        overflow: "auto",
        flexDirection: "column",
        height: 240,
    },
    tab: {
        borderRadius: 4,
        width: "100%",
        "& .MuiTab-wrapper": {
            color: "#128c7e"
        },
        "& .MuiTabs-flexContainer": {
            justifyContent: "center"
        }
    },
    paper: {
        padding: theme.spacing(2),
        display: "flex",
        alignItems: "center",
        marginBottom: 12,
        width: "100%",
    },
    cardAvatar: {
        fontSize: "55px",
        color: grey[500],
        backgroundColor: "#ffffff",
        width: theme.spacing(7),
        height: theme.spacing(7),
    },
    cardTitle: {
        fontSize: "18px",
        color: blue[700],
    },
    cardSubtitle: {
        color: grey[600],
        fontSize: "14px",
    },
    alignRight: {
        textAlign: "right",
    },
    fullWidth: {
        width: "100%",
    },
    selectContainer: {
        width: "100%",
        textAlign: "left",
    },
    colorAdorment: {
        width: 20,
        height: 20,
    },

    uploadInput: {
        display: "none",
    },

    appLogoLightPreviewDiv: {
        backgroundColor: "white",
        padding: "10px",
        borderStyle: "solid",
        borderWidth: "1px",
        borderColor: "#424242",
    },
    appLogoLightPreviewImg: {
        width: "100%",
        maxHeight: 72,
        content: "url(" + theme.calculatedLogoLight() + ")"
    },

    appLogoDarkPreviewDiv: {
        backgroundColor: "#424242",
        padding: "10px",
        borderStyle: "solid",
        borderWidth: "1px",
        borderColor: "white",
    },

    appLogoDarkPreviewImg: {
        width: "100%",
        maxHeight: 72,
        content: "url(" + theme.calculatedLogoDark() + ")"
    },

    appLogoFaviconPreviewDiv: {
        padding: "10px",
        borderStyle: "solid",
        borderWidth: "1px",
        borderColor: "black",
    },

    appLogoFaviconPreviewImg: {
        width: "100%",
        maxHeight: 72,
        content: "url(" + ((theme.appLogoFavicon) ? theme.appLogoFavicon : "") + ")"
    },


    appLogoPWAIconPreviewDiv: {
        padding: "10px",
        borderStyle: "solid",
        borderWidth: "1px",
        borderColor: "black",
    },

    appLogoPWAIconPreviewImg: {
        width: "100%",
        maxHeight: 72,
        content: "url(" + ((theme.appLogoPWAIcon) ? theme.appLogoPWAIcon : "") + ")"
    },

    title: {
        textAlign: "center",
        fontSize: "18px",
        fontWeight: "bold",
        color: grey[600]
    }
}));

const themeColors = [
    "primaryColorLight",
    "secondaryColorLight",
    "primaryColorDark",
    "secondaryColorDark",
    "iconColorLight",
    "iconColorDark",
    "chatlistLight",
    "chatlistDark",
    "boxLeftLight",
    "boxLeftDark",
    "boxRightLight",
    "boxRightDark"
];

const colorLabels = {
    primaryColorLight: "Cor Primária Modo Claro",
    secondaryColorLight: "Cor Secundária Modo Claro",
    primaryColorDark: "Cor Primária Modo Escuro",
    secondaryColorDark: "Cor Secundária Modo Escuro",
    iconColorLight: "Cor do Ícone Modo Claro",
    iconColorDark: "Cor do Ícone Modo Escuro",
    chatlistLight: "Fundo Chat Interno Modo Claro",
    chatlistDark: "Fundo Chat Interno Modo Escuro",
    boxLeftLight: "Mensagens de Outros Modo Claro",
    boxLeftDark: "Mensagens de Outros Modo Escuro",
    boxRightLight: "Mensagens do Usuário Modo Claro",
    boxRightDark: "Mensagens do Usuário Modo Escuro",
};

const imageFiles = [
    "appLogoLight",
    "appLogoDark",
    "appLogoFavicon",
    "appLogoPWAIcon"
];

const imageLabels = {
    appLogoLight: "Logotipo Claro",
    appLogoDark: "Logotipo Escuro",
    appLogoFavicon: "Favicon",
    appLogoPWAIcon: "Ícone PWA"
};

export default function Whitelabel(props) {
    const { settings } = props;
    const classes = useStyles();
    const { colorMode } = useContext(ColorModeContext);
    const [settingsLoaded, setSettingsLoaded] = useState({});
    const { getCurrentUserInfo } = useAuth();
    const [currentUser, setCurrentUser] = useState({});
    const [selectedColorKey, setSelectedColorKey] = useState(themeColors[0]);
    const [selectedColorValue, setSelectedColorValue] = useState("");
    const [selectedUploadType, setSelectedUploadType] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);

    const logoLightInput = useRef(null);
    const logoDarkInput = useRef(null);
    const logoFaviconInput = useRef(null);
    const pwaIconInput = useRef(null);
    const appNameInput = useRef(null);
    const [appName, setAppName] = useState(settingsLoaded.appName || "AutoAtende");
    const [copyright, setCopyright] = useState(settingsLoaded.copyright || "");
    const [privacy, setPrivacy] = useState(settingsLoaded.privacy || "");
    const [terms, setTerms] = useState(settingsLoaded.terms || "");
    const { update } = useSettings();

    function updateSettingsLoaded(key, value) {
        const newSettings = {...settingsLoaded};
        newSettings[key] = value;
        setSettingsLoaded(newSettings);
        console.debug(key, value, newSettings, settingsLoaded);
    }

    useEffect(() => {
        getCurrentUserInfo().then((u) => {
            setCurrentUser(u);
        });
    
        console.debug("settings", settings);
    
        if (Array.isArray(settings) && settings.length) {
            const appLogoLight = settings.find((s) => s.key === "appLogoLight")?.value;
            const appLogoDark = settings.find((s) => s.key === "appLogoDark")?.value;
            const appLogoFavicon = settings.find((s) => s.key === "appLogoFavicon")?.value;
            const appLogoPWAIcon = settings.find((s) => s.key === "appLogoPWAIcon")?.value;
            const appName = settings.find((s) => s.key === "appName")?.value;
            const copyright = settings.find((s) => s.key === "copyright")?.value;
            const privacy = settings.find((s) => s.key === "privacy")?.value;
            const terms = settings.find((s) => s.key === "terms")?.value;
    
            const initialSettings = {};
            themeColors.forEach(colorKey => {
                initialSettings[colorKey] = settings.find((s) => s.key === colorKey)?.value || "";
            });
    
            setSettingsLoaded({
                appLogoLight,
                appLogoDark,
                appLogoFavicon,
                appLogoPWAIcon,
                appName: appName || "AutoAtende",
                copyright,
                privacy,
                terms,
                ...initialSettings
            });
            setSelectedColorValue(initialSettings[themeColors[0]]);

            setAppName(appName || "AutoAtende");
            setCopyright(copyright || "");
            setPrivacy(privacy || "");
            setTerms(terms || "");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settings]);

    const handleColorChange = (color) => {
        const newColor = color.hex;
        setSelectedColorValue(newColor);
        handleSaveSetting(selectedColorKey, newColor);
    
        const colorModeFunction = colorMode[`set${capitalizeFirstLetter(selectedColorKey)}`];
        if (typeof colorModeFunction === 'function') {
            colorModeFunction(newColor);
        } else {
            toast.error(`Função não encontrada para a chave: ${selectedColorKey}`);
        }
    };

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    async function handleSaveSetting(key, value) {
        await update({ key, value });
        setSettingsLoaded(prev => ({ ...prev, [key]: value }));
        let label;
        if (colorLabels[key]) {
            label = colorLabels[key];
        } else if (imageLabels[key]) {
            label = imageLabels[key];
        } else {
            label = key;
        }
    
        toast.success(`Atualizada com sucesso: ${label}`);
    }

    const uploadLogo = async (e, mode) => {
        if (!e.target.files) {
            return;
        }

        const file = e.target.files[0];
        const formData = new FormData();

        formData.append("file", file);
        formData.append("mode", mode);

        api.post("/settings/logo", formData, {
            onUploadProgress: (event) => {
                let progress = Math.round(
                    (event.loaded * 100) / event.total
                );
                console.log(
                    `A imagem está ${progress}% carregada... `
                );
            },
        }).then((response) => {
            updateSettingsLoaded(`${mode}`, response.data);
            colorMode[`set${capitalizeFirstLetter(mode)}`](process.env.REACT_APP_BACKEND_URL + "/public/" + response.data);
            setSelectedFile(file);
        }).catch((err) => {
            console.error(
                `Houve um problema ao realizar o upload da imagem.`
            );
            console.log(err);
        });
    };

    return (
        <>
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={4}>
                    {/* Coluna da esquerda */}
                    <FormControl className={classes.selectContainer} style={{ marginBottom: '16px' }}>
                        <TextField
                            id="appname-field"
                            label="Nome do sistema"
                            variant="standard"
                            name="appName"
                            value={appName}
                            inputRef={appNameInput}
                            onChange={(e) => setAppName(e.target.value)}
                            onBlur={async (_) => {
                                await handleSaveSetting("appName", appName);
                                colorMode.setAppName(appName || "AutoAtende");
                            }}
                        />
                    </FormControl>
                    <FormControl className={classes.selectContainer} style={{ marginBottom: '16px' }}>
                        <TextField
                            id="copyright-field"
                            label="Copyright"
                            variant="standard"
                            value={copyright}
                            onChange={(e) => setCopyright(e.target.value)}
                            onBlur={() => handleSaveSetting("copyright", copyright)}
                        />
                    </FormControl>
                    <FormControl className={classes.selectContainer} style={{ marginBottom: '16px' }}>
                        <TextField
                            id="privacy-field"
                            label="Link da Política de Privacidade"
                            variant="standard"
                            value={privacy}
                            onChange={(e) => setPrivacy(e.target.value)}
                            onBlur={() => handleSaveSetting("privacy", privacy)}
                        />
                    </FormControl>
                    <FormControl className={classes.selectContainer} style={{ marginBottom: '16px' }}>
                        <TextField
                            id="terms-field"
                            label="Link dos Termos de uso"
                            variant="standard"
                            value={terms}
                            onChange={(e) => setTerms(e.target.value)}
                            onBlur={() => handleSaveSetting("terms", terms)}
                        />
                    </FormControl>

                    <FormControl className={classes.selectContainer} style={{ marginTop: '32px', marginBottom: '16px' }}>
                        <InputLabel>Escolha a cor a ser alterada:</InputLabel>
                        <Select
                            value={selectedColorKey}
                            onChange={(e) => {
                                setSelectedColorKey(e.target.value);
                                setSelectedColorValue(settingsLoaded[e.target.value] || "");
                            }}
                        >
                            {themeColors.map(colorKey => (
                                <MenuItem key={colorKey} value={colorKey}>
                                    {colorLabels[colorKey]}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Grid item xs={12}>
                        <TwitterPicker
                            color={selectedColorValue}
                            onChangeComplete={handleColorChange}
                        />
                    </Grid>
    
                    {/* Campo de Upload */}
                    <FormControl className={classes.selectContainer} style={{ marginTop: '32px' }}>
                        <InputLabel>Escolha o tipo de logo:</InputLabel>
                        <Select
                            value={selectedUploadType}
                            onChange={(e) => {
                                setSelectedUploadType(e.target.value);
                                setSelectedFile(null);
                            }}
                        >
                            {imageFiles.map(imageKey => (
                                <MenuItem key={imageKey} value={imageKey}>
                                    {imageLabels[imageKey]}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {selectedUploadType && (
                        <FormControl className={classes.selectContainer}>
                            <TextField
                                id={`${selectedUploadType}-upload-field`}
                                label={imageLabels[selectedUploadType]}
                                variant="standard"
                                value={selectedFile ? selectedFile.name : ""}
                                InputProps={{
                                    endAdornment: (
                                        <>
                                            {settingsLoaded[selectedUploadType] && (
                                                <IconButton
                                                    size="small"
                                                    color="default"
                                                    onClick={() => {
                                                        handleSaveSetting(selectedUploadType, "");
                                                        colorMode[`set${capitalizeFirstLetter(selectedUploadType)}`](defaultLogoLight);
                                                    }}
                                                >
                                                    <Delete />
                                                </IconButton>
                                            )}
                                            <input
                                                type="file"
                                                id={`upload-${selectedUploadType}-button`}
                                                ref={selectedUploadType === "appLogoLight" ? logoLightInput : selectedUploadType === "appLogoDark" ? logoDarkInput : selectedUploadType === "appLogoFavicon" ? logoFaviconInput : pwaIconInput}
                                                className={classes.uploadInput}
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (!file) return;

                                                    setSelectedFile(file);
                                                    uploadLogo(e, selectedUploadType)
                                                        .then(() => {
                                                            console.log('Upload completado com sucesso.');
                                                        })
                                                        .catch((err) => {
                                                            console.error('Erro ao fazer o upload:', err);
                                                        });
                                                }}
                                            />

                                            <label htmlFor={`upload-${selectedUploadType}-button`}>
                                                <IconButton
                                                    size="small"
                                                    color="default"
                                                    onClick={() => {
                                                        document.getElementById(`upload-${selectedUploadType}-button`).click();
                                                    }}
                                                >
                                                    <AttachFile />
                                                </IconButton>
                                            </label>
                                        </>
                                    ),
                                }}
                            />
                        </FormControl>
                    )}

                </Grid>

                <Grid item xs={12} sm={6} md={8}>
                    {/* Coluna da direita para pré-visualização */}
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Typography variant="subtitle1" gutterBottom>Logo Light</Typography>
                            <div className={classes.appLogoLightPreviewDiv}>
                                <img className={classes.appLogoLightPreviewImg} alt="light-logo-preview" />
                            </div>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="subtitle1" gutterBottom>Logo Dark</Typography>
                            <div className={classes.appLogoDarkPreviewDiv}>
                                <img className={classes.appLogoDarkPreviewImg} alt="dark-logo-preview" />
                            </div>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="subtitle1" gutterBottom>Favicon Logo</Typography>
                            <div className={classes.appLogoFaviconPreviewDiv}>
                                <img className={classes.appLogoFaviconPreviewImg} alt="favicon-logo-preview" />
                            </div>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="subtitle1" gutterBottom>PWA Icon</Typography>
                            <div className={classes.appLogoPWAIconPreviewDiv}>
                                <img className={classes.appLogoPWAIconPreviewImg} alt="pwaIcon-logo-preview" />
                            </div>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </>
    );

}