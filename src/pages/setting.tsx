import React, { useState } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import ListItemIcon from "@mui/material/ListItemIcon";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import DeleteIcon from "@mui/icons-material/Delete";
import Container from "@mui/material/Container";
import ArrowBack from "@mui/icons-material/ArrowBack";
import LoadingButton from "@mui/lab/LoadingButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { makeStyles } from "y/utils/makesStyles";
import { useRouter } from "next/router";
import Divider from "@mui/material/Divider";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  apiChangePassword,
  apiCreateUser,
  apiDeleteUser,
  apiUserList,
} from "./clientApi";
import { type GetServerSideProps } from "next";
import { prisma } from "y/server/db";
import { withSessionSsr } from "y/server/wrap";
import { useConfirmDialog } from "y/hooks/useConfirmDialog";

const useStyles = makeStyles()((theme) => ({
  root: {},
  appBarTitle: {
    flexGrow: 1,
  },
  card: {
    marginTop: theme.spacing(2),
  },
}));

type SettingProps = {
  isAdmin: boolean;
};

function AdminSetting() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");

  const userListQuery = useQuery({
    queryKey: ["userList"] as const,
    queryFn: () => apiUserList().then((res) => res.data),
  });

  const userList = userListQuery.data ?? [];

  const addMutation = useMutation({
    mutationFn: () => apiCreateUser({ username: userName, password }),
  });

  const { dialog, openDialog, closeDialog } = useConfirmDialog();

  return (
    <>
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Members
          </Typography>
          <List
            subheader={
              <ListSubheader disableGutters>Add New User</ListSubheader>
            }
          >
            <ListItem disableGutters>
              <TextField
                label="User Name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </ListItem>
            <ListItem disableGutters>
              <TextField
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </ListItem>
            <ListItem disableGutters>
              <LoadingButton
                loading={addMutation.isLoading}
                onClick={async () => {
                  await addMutation.mutateAsync();
                  setUserName("");
                  setPassword("");
                  await userListQuery.refetch();
                }}
              >
                Add
              </LoadingButton>
            </ListItem>
          </List>
          <Divider />
          <Table aria-label="user table">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>User Name</TableCell>
                <TableCell>Admin</TableCell>
                <TableCell align="right"></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {userList.map((row) => (
                <TableRow
                  key={row.id}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {row.id}
                  </TableCell>
                  <TableCell>{row.username}</TableCell>
                  <TableCell>{row.isAdmin.toString()}</TableCell>
                  <TableCell>
                    {!row.isAdmin && (
                      <IconButton
                        onClick={async () => {
                          try {
                            await openDialog({
                              title: "Delete User",
                              content: `Delete user ${row.username}?`,
                            });
                          } catch (e) {
                            return;
                          }
                          closeDialog();
                          await apiDeleteUser({ userId: row.id });
                          return userListQuery.refetch();
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {dialog}
    </>
  );
}

export default function Setting(props: SettingProps) {
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");

  const router = useRouter();

  const goBack = () => {
    return router.push("/bookshelf");
  };

  const { classes } = useStyles();

  const passwordMutation = useMutation({
    mutationFn: () => apiChangePassword({ password }),
  });

  return (
    <>
      <Box className={classes.root}>
        <AppBar component={"nav"}>
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={goBack}
            >
              <ArrowBack />
            </IconButton>
            <Typography className={classes.appBarTitle} variant="h6" noWrap>
              Setting
            </Typography>
          </Toolbar>
        </AppBar>
        <Container maxWidth="sm">
          <Toolbar />
          <Card className={classes.card}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Modify Password
              </Typography>
              <Box sx={{ mb: 1 }}>
                <TextField
                  label="new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Box>
              <div>
                <TextField
                  label="input again"
                  value={rePassword}
                  onChange={(e) => setRePassword(e.target.value)}
                />
              </div>
            </CardContent>
            <CardActions>
              {/* <Button>confirm</Button> */}
              <LoadingButton
                loading={passwordMutation.isLoading}
                loadingIndicator="Loading…"
                onClick={() => {
                  void passwordMutation.mutateAsync().then(() => {
                    setPassword("");
                    setRePassword("");
                  });
                }}
              >
                confirm
              </LoadingButton>
            </CardActions>
          </Card>

          {props.isAdmin && <AdminSetting />}
        </Container>
      </Box>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<SettingProps> =
  withSessionSsr(async ({ req }) => {
    const userId = req.session.user.id;
    const user = await prisma.user.findFirst({ where: { id: userId } });

    return {
      props: { isAdmin: Boolean(user?.isAdmin) },
    };
  });
