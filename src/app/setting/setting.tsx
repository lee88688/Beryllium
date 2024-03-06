"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useConfirmDialog } from "y/hooks/useConfirmDialog";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListSubheader from "@mui/material/ListSubheader";
import ListItem from "@mui/material/ListItem";
import TextField from "@mui/material/TextField";
import LoadingButton from "@mui/lab/LoadingButton";
import Divider from "@mui/material/Divider";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import ArrowBack from "@mui/icons-material/ArrowBack";
import Container from "@mui/material/Container";
import CardActions from "@mui/material/CardActions";
import { makeStyles } from "y/utils/makesStyles";
import { addUser, changePassword, removeUser } from "./actions";

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
  usersData: { id: number; username: string; isAdmin: boolean }[];
};

function AdminSetting(props: Pick<SettingProps, "usersData">) {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");

  const addMutation = useMutation({
    mutationFn: () => addUser({ username: userName, password: password }),
  });

  const { dialog, openDialog, closeDialog } = useConfirmDialog();

  const router = useRouter();

  return (
    <>
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>
            用户
          </Typography>
          <List
            subheader={<ListSubheader disableGutters>添加新用户</ListSubheader>}
          >
            <ListItem disableGutters>
              <TextField
                label="用户名"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </ListItem>
            <ListItem disableGutters>
              <TextField
                label="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </ListItem>
            <ListItem disableGutters>
              <LoadingButton
                loading={addMutation.isLoading}
                onClick={async () => {
                  await addMutation.mutateAsync();
                  router.refresh();
                  setUserName("");
                  setPassword("");
                }}
              >
                新增
              </LoadingButton>
            </ListItem>
          </List>
          <Divider />
          <Table aria-label="user table">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>用户名称</TableCell>
                <TableCell>管理员</TableCell>
                <TableCell align="right"></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {props.usersData.map((row) => (
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
                              title: "删除用户",
                              content: `是否删除${row.username}?`,
                            });
                          } catch (e) {
                            return;
                          }
                          closeDialog();
                          await removeUser({ userId: row.id });
                          router.refresh();
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
    mutationFn: () => changePassword(password),
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
              设置
            </Typography>
          </Toolbar>
        </AppBar>
        <Container maxWidth="sm">
          <Toolbar />
          <Card className={classes.card}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                修改密码
              </Typography>
              <Box sx={{ mb: 1 }}>
                <TextField
                  label="新密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Box>
              <div>
                <TextField
                  label="再次输入"
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
                确认
              </LoadingButton>
            </CardActions>
          </Card>

          {props.isAdmin && <AdminSetting usersData={props.usersData} />}
        </Container>
      </Box>
    </>
  );
}
