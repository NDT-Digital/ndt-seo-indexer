export async function writeToStream(
  stream: NodeJS.WritableStream,
  chunk: string,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const onDrain = () => {
      cleanup();
      resolve();
    };

    const cleanup = () => {
      stream.off("error", onError);
      stream.off("drain", onDrain);
    };

    stream.once("error", onError);

    if (stream.write(chunk)) {
      cleanup();
      resolve();
      return;
    }

    stream.once("drain", onDrain);
  });
}

export async function endStream(stream: NodeJS.WritableStream): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    stream.once("finish", () => resolve());
    stream.once("error", (error) => reject(error));
    stream.end();
  });
}
