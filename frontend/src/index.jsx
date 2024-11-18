import React from "react";
import ReactDOM from "react-dom";
import CssBaseline from "@mui/material/CssBaseline";
import * as serviceWorker from './serviceWorker';
import {LocalizationProvider} from '@mui/x-date-pickers';
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs'


import App from "./App";

ReactDOM.render(
  //<React.StrictMode>
  <CssBaseline>
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <App/>
    </LocalizationProvider>

  </CssBaseline>
  //</React.StrictMode>
  ,
  document.getElementById('root'),
  () => {
    window.finishProgress();
  }
);

serviceWorker.register();

