import React from "react";
import Skeleton from '@mui/material/Skeleton';
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import { i18n } from "../../translate/i18n";
import { Grid } from "@mui/material";

const ContactDrawerSkeleton = ({ classes }) => {
	return (
        <div className={classes.content}>
			<Paper square variant="outlined" className={classes.contactHeader}>
				<Grid container>
					<Grid item>
						<Skeleton
							animation="wave"
							variant="circular"
							width={60}
							height={60}
							className={classes.contactAvatar}
						/>
					</Grid>
					<Grid item>
						<Skeleton animation="wave" height={25} width={90} />
						<Skeleton animation="wave" height={25} width={80} />
						<Skeleton animation="wave" height={25} width={80} />
					</Grid>
				</Grid>
			</Paper>
			<Paper square className={classes.contactDetails}>
				<Typography variant="subtitle1">
					{i18n.t("contactDrawer.extraInfo")}
				</Typography>
				<Paper square variant="outlined" className={classes.contactExtraInfo}>
					<Skeleton animation="wave" height={20} width={60} />
					<Skeleton animation="wave" height={20} width={160} />
				</Paper>
				<Paper square variant="outlined" className={classes.contactExtraInfo}>
					<Skeleton animation="wave" height={20} width={60} />
					<Skeleton animation="wave" height={20} width={160} />
				</Paper>
				<Paper square variant="outlined" className={classes.contactExtraInfo}>
					<Skeleton animation="wave" height={20} width={60} />
					<Skeleton animation="wave" height={20} width={160} />
				</Paper>
			</Paper>
		</div>
    );
};

export default ContactDrawerSkeleton;
