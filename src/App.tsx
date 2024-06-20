// import "./App.css";
import {
  Button,
  Stack,
  SxProps,
  TextField,
  Theme,
  Typography,
  styled,
  useTheme,
} from "@mui/material";
import React, { useEffect } from "react";
import { TimerAnimation } from "./timerAnimation";

const StackStyled = styled(Stack)(({ theme }) => ({
  padding: theme.spacing(2),
  border: "1px solid white",
  ["&.selected"]: {
    border: "1px solid black",
    backgroundColor: "#f4f7ff",
    boxShadow: theme.shadows[3],
    borderRadius: "3px",
  },
}));

const animation = new TimerAnimation();

export const App: React.FC = () => {
  const [timerInput, setTimerInput] = React.useState<string>("");
  const [errorText, setErrorText] = React.useState<string>("");
  const [timerInputDecimal, setTimerInputDecimal] = React.useState<string>("1");
  const [errorTextDecimal, setErrorTextDecimal] = React.useState<string>("");
  const [useDecimal, setUseDecimal] = React.useState<boolean>(true);

  // const [startTimeMs, setStartTimeMs] = React.useState<number>(0);
  const [durationMs, setDurationMs] = React.useState<number>(0);
  // const [currentSeconds, setCurrentSeconds] = React.useState<number>(0);
  // const [startSeconds, setStartSeconds] = React.useState<number>(0);
  const [isPlay, setIsPlay] = React.useState<boolean>(false);
  const [isStartup, setIsStartup] = React.useState<boolean>(true);

  const divRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    handleTimeChangeDecimal("7");
  }, []);

  useEffect(() => {
    if (divRef.current) {
      animation.initialize(divRef.current);
    }
  }, [divRef]);

  const handleStart = React.useCallback(() => {
    animation.set(
      durationMs,
      useDecimal
        ? Math.round((durationMs / 1000 / 60 / 60 / 24) * 100000)
        : Math.round(durationMs / 1000),
      useDecimal
    );
  }, [durationMs, useDecimal]);

  useEffect(() => {
    if (isStartup && durationMs > 0) {
      handleStart();
      setIsStartup(false);
    }
  }, [durationMs, handleStart, isStartup]);

  useEffect(() => {
    if (isPlay) {
      animation.play();
    } else {
      animation.pause();
    }
  }, [isPlay]);

  const handlePlayPause = () => {
    setIsPlay(!isPlay);
  };

  const theme = useTheme();
  const timeHeadingStyle: SxProps<Theme> = {
    ...theme.typography.h5,
    p: 2,
    color: theme.palette.primary.light,
  };

  const handleTimeChange = (newValue: string) => {
    setTimerInput(newValue);
    let minutes = 0;
    let seconds = 0;
    if (new RegExp("^\\d+:\\d\\d$").test(newValue)) {
      minutes = parseInt(newValue.split(":")[0]);
      seconds = parseInt(newValue.split(":")[1]);
    } else if (new RegExp("^\\d+\\.\\d$").test(newValue)) {
      minutes = parseInt(newValue.split(".")[0]);
      seconds = (parseInt(newValue.split(".")[1]) / 100) * 60;
    } else if (new RegExp("^\\d+$").test(newValue)) {
      minutes = parseInt(newValue);
    }

    if (
      minutes >= 0 &&
      minutes <= 10 &&
      seconds >= 0 &&
      seconds < 60 &&
      minutes + seconds > 0 &&
      (minutes == 10 ? seconds == 0 : true)
    ) {
      setErrorText("");
      const duration = (minutes * 60 + seconds) * 1000;
      setDurationMs(duration);
      const decimalMinutes =
        Math.round((duration / 1000 / 60 / 60 / 24) * 10000 * 10) / 10;
      setTimerInputDecimal(decimalMinutes.toString());
    } else {
      setErrorText("Please enter a time (0:01 to 10:00).");
    }
  };

  const handleTimeChangeDecimal = (newValue: string) => {
    setTimerInputDecimal(newValue);

    let minutes = 0;

    if (new RegExp("^(\\d+(\\.\\d)?)$").test(newValue)) {
      minutes = parseFloat(newValue);
    }

    if (minutes > 0 && minutes <= 100) {
      setErrorTextDecimal("");

      const duration =
        (Math.round(minutes * 10) / 10 / 10000) * 24 * 60 * 60 * 1000;
      // console.log(duration);
      setDurationMs(duration);
      const nMinutes = Math.floor(duration / 1000 / 60);
      const nSeconds = Math.floor((duration / 1000) % 60);
      setTimerInput(
        nMinutes + ":" + (nSeconds < 10 ? "0" + nSeconds : nSeconds)
      );
    } else {
      setErrorTextDecimal("Please enter a time (0.1 to 100.0).");
    }
  };

  return (
    <>
      <Stack
        alignItems="center"
        gap={2}
        sx={{
          position: "absolute",
          width: "100vw",
          height: "100vh",
        }}
      >
        <Typography variant="h2" textAlign="center">
          Enc Timer
        </Typography>
        <Stack
          gap={1}
          direction="row"
          alignItems="center"
          sx={
            {
              // [theme.breakpoints.down("md")]: {
              //   flexDirection: "column",
              // },
            }
          }
        >
          <StackStyled
            className={!useDecimal ? "selected" : ""}
            onClick={() => setUseDecimal(false)}
          >
            <Typography sx={{ ...timeHeadingStyle }}>
              <span style={{ color: "#ffffff" }}>ab</span>normal Time
            </Typography>
            <TextField
              error={errorText !== ""}
              label="Duration (minutes)"
              variant="outlined"
              helperText={
                errorText !== "" ? errorText : "e.g. 3 or 1:41 (0:01 to 10:00)"
              }
              size="small"
              value={timerInput}
              onChange={(e) => handleTimeChange(e.target.value)}
            />
          </StackStyled>
          <StackStyled
            className={useDecimal ? "selected" : ""}
            onClick={() => setUseDecimal(true)}
          >
            <Typography sx={{ ...timeHeadingStyle }}>decimal Time</Typography>
            <TextField
              error={errorTextDecimal !== ""}
              label="Duration (minutes)"
              variant="outlined"
              helperText={
                errorTextDecimal !== ""
                  ? errorTextDecimal
                  : "e.g. 42 or 3.1 (0.1 to 99)"
              }
              size="small"
              value={timerInputDecimal}
              onChange={(e) => handleTimeChangeDecimal(e.target.value)}
            />
          </StackStyled>
          <Stack sx={{ m: 2, width: "120px" }} gap={2}>
            <Button
              variant="contained"
              disabled={errorText !== ""}
              onClick={handleStart}
            >
              Restart
            </Button>
            <Button
              variant="contained"
              // disabled={isStartup}
              onClick={handlePlayPause}
            >
              {isPlay ? "Pause" : "Play"}
            </Button>
          </Stack>
        </Stack>
        <div
          ref={divRef}
          style={{
            flexGrow: 1,
            width: "600px",
          }}
        />
      </Stack>
    </>
  );
};
