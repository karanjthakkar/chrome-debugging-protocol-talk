const onClick = () => {
  let a = 0;
  for (let i = 0; i < 500000000; i++) {
    a = i;
  }
};

const setTimeoutTest = () => {
  setTimeout(() => {
    let a = 0;
    for (let i = 0; i < 500000000; i++) {
      a = i;
    }
  }, 0);
};

const requestAnimationFrameTest = () => {
  requestAnimationFrame(() => {
    let a = 0;
    for (let i = 0; i < 500000000; i++) {
      a = i;
    }
  });
};

setTimeoutTest();
requestAnimationFrameTest();
