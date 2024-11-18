import React from "react";

import Tickets from "../TicketsCustom"
import TicketAdvanced from "../TicketsAdvanced";
import {isWidthUp} from "@mui/material/Hidden/withWidth";
import {useTheme} from "@mui/material/styles";
import {useMediaQuery} from "@mui/material";

// FIXME checkout https://mui.com/components/use-media-query/#migrating-from-withwidth
const withWidth = () => (WrappedComponent) => (props) => <WrappedComponent {...props} width="xs" />;
function useIsWidthUp(breakpoint) {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.up(breakpoint));
}

function TicketResponsiveContainer (props) {

    if (useIsWidthUp('md', props.width)) {
        return <Tickets />;
    }
    return <TicketAdvanced />
}

export default withWidth()(TicketResponsiveContainer);
