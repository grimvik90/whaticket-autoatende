import React, {useState} from 'react';

import {
  DatePicker,
} from '@mui/x-date-pickers';
import MomentUtils from '@date-io/moment';
import moment from 'moment';
import {Box} from '@mui/material';
import TextField from "@mui/material/TextField";

export const DatePickerMoment = ({label, getDate}) => {
  const [selectedDate, setDate] = useState(null);
  const [inputValue, setInputValue] = useState(null);

  const onDateChange = (date, value) => {
    getDate(moment(date).format('YYYY-MM-DD'));
    setDate(date);
    setInputValue(value);
  };

  const dateFormatter = (str) => {
    return str;
  };

  return (

    <DatePicker
      size={'small'}
      id='datePicker-input'
      autoOk={true}
      label={label}
      showTodayButton={true}
      value={selectedDate}
      format='DD/MM/YYYY'
      inputValue={inputValue}
      onChange={onDateChange}
      renderInput={(params) => <TextField
        label={label}
        placeholder={label}
        variant={'outlined'} size='small' fullWidth {...params} sx={{width: '20ch'}}/>}
      // rifmFormatter={dateFormatter}
    />
  );
};
