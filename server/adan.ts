// basically just wanna have this file for downloading
//   the adan binary and serving it to the client

const ADAN_BINARY_URL = "https://github.com/Cappucina/ADAN/releases/download/latest/ADAN-Linux-Nightly";

export async function downloadAdanBinary(): Promise<Uint8Array> {
    const response = await fetch(ADAN_BINARY_URL);

    if (!response.ok) {
        throw new Error(`Failed to download ADAN binary: ${response.status} ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer); // binary data as Uint8Array to be sent to client
}

