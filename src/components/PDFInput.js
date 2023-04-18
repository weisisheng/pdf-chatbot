import { useRef, useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import { CgSoftwareUpload } from "react-icons/cg";
import { IoIosCloseCircle } from "react-icons/io";

const MAX_FILE_SIZE_MB = 16;

const PDFInput = ({ setDocs, setMessages }) => {
    // state
    const [file, setFile] = useState(null);
    const [currentFilename, setCurrentFilename] = useState("");
    const [loading, setLoading] = useState(false);
    const [fileChosen, setFileChosen] = useState(false);
    const [status, setStatus] = useState({
        type: "neutral",
        message: "",
    });

    // reference for the file input
    const fileInputRef = useRef(null);

    // select status styling based on message type
    const _statusStyleHelper = (type) => {
        if (type === "error") {
            // return error styles
            return "text-left text-lg text-red-600";
        } else if (type === "success") {
            // return success styles
            return "text-left text-lg text-green-600";
        } else {
            // return neutral styles
            return "text-left text-lg text-white";
        }
    };

    // store user PDF in state
    const storePDF = async (event) => {
        // prevent browser refresh
        event.preventDefault();

        // update relevant state if file exists
        if (event.target.files && event.target.files[0]) {
            setFile(event.target.files[0]);
            setFileChosen(true);
        }
    };

    // handle the closing of a file
    const handleCloseFile = () => {
        // clear file input
        fileInputRef.current.value = null;
        fileInputRef.current.files = null;

        // reset all file-related pieces of state
        setFile(null);
        setFileChosen(false);
        setCurrentFilename("");
    };

    // handle loading of a PDF
    const handleLoadPDF = async (event) => {
        // prevent browser refresh
        event.preventDefault();

        // ensure that a file is chosen
        if (!fileChosen) {
            setStatus({
                type: "error",
                message: "Please choose a PDF first!",
            });
            return;
        }

        // ensure user isn't re-loading the same PDF
        if (file.name === currentFilename) {
            setStatus({
                type: "success",
                message: "That PDF is already loaded!",
            });
            return;
        }

        // cap max file size at 16 MB (for now)
        const fileSize = parseInt((file.size / 1024 / 1024).toFixed(4));
        if (fileSize > MAX_FILE_SIZE_MB) {
            setStatus({
                type: "error",
                message: `PDF is too large :( Max size is ${MAX_FILE_SIZE_MB} MB`,
            });
            return;
        }

        // save current filename and start file load process
        setCurrentFilename(file.name);
        setLoading(true);

        // give status update
        setStatus({
            type: "neutral",
            message: `Loading \"${file.name}\"...`,
        });

        // get pre-signed URL for S3 upload and concat into formData object
        const fileName = encodeURIComponent(file.name);
        const fileType = encodeURIComponent(file.type);
        const s3Response = await fetch(
            `/api/upload-to-s3?fileName=${fileName}&fileType=${fileType}`
        );
        const { url, fields } = await s3Response.json();

        const formData = new FormData();
        Object.entries({ ...fields, file }).forEach(([key, value]) => {
            formData.append(key, value);
        });

        // use pre-signed URL to upload file to S3
        try {
            const upload = await fetch(url, {
                method: "POST",
                body: formData,
            });
            if (!upload.ok) {
                setStatus({
                    type: "error",
                    message: "Upload to S3 bucket failed. (No further information).",
                });
            }
        } catch (error) {
            const errorMsg = await upload.text();
            setStatus({
                type: "error",
                message: `Upload to S3 bucket failed. \n ${upload.status} ${errorMsg}`,
            });
        }

        // call split API route to split PDF into docs (chunks)
        const docsResponse = await fetch(`api/split?fileName=${file.name}`);
        const data = await docsResponse.json();

        // update status message with split API route result
        setStatus({
            type: data.result.type,
            message: data.result.message,
        });

        // update docs state with returned chunks (if they are returned)
        if (data.result.docs.length !== 0) {
            setDocs(data.result.docs);
        }

        // reset messages list if load was successful
        if (data.result.type === "success") {
            setMessages([
                {
                    text: "Ask a question about the PDF :)",
                    type: "response",
                },
            ]);
        }
        setLoading(false);
    };

    return (
        <div className="flex w-[75vw] max-w-4xl flex-col">
            <p className="p-2 text-lg text-zinc-200">Please select a PDF:</p>
            <div className="flex flex-col items-center justify-center gap-2 md:flex-row md:justify-between">
                <form
                    onSubmit={handleLoadPDF}
                    className="flex w-full flex-col items-stretch gap-2 sm:flex-row md:w-1/2"
                >
                    <input
                        accept="application/pdf"
                        ref={fileInputRef}
                        disabled={loading}
                        autoFocus={false}
                        type="file"
                        id="file"
                        name="file"
                        onChange={storePDF}
                        className="w-full resize-none rounded-[0.3rem] border border-[#30373d] p-3 text-[1.1rem] text-[#ececf1] outline-none disabled:opacity-50 sm:w-2/3"
                    />
                    {fileChosen ? (
                        <button
                            onClick={handleCloseFile}
                            className="cursor-pointer border-none bg-none hover:opacity-80"
                        >
                            <IoIosCloseCircle className="text-[26px] text-red-600" />
                        </button>
                    ) : null}
                    <button
                        type="submit"
                        disabled={loading}
                        className="h-14 w-full flex-grow rounded-[0.3rem] border-none bg-[#eb9722] p-2 text-white hover:cursor-pointer hover:opacity-80 disabled:cursor-not-allowed disabled:bg-[#1f2227] sm:h-auto sm:w-1/3"
                    >
                        {loading ? (
                            <div className="flex flex-row items-center justify-center gap-3">
                                <CircularProgress
                                    color="inherit"
                                    size={20}
                                    className="h-6 w-6 text-white"
                                />{" "}
                                <p className="text-base text-white">Loading...</p>
                            </div>
                        ) : (
                            <div className="flex flex-row justify-center gap-2">
                                <CgSoftwareUpload className="h-6 w-6 text-white" />
                                <p className="text-base text-white">Load PDF</p>
                            </div>
                        )}
                    </button>
                </form>
                {status.message ? (
                    <div className="mt-2 flex flex-grow items-center justify-center">
                        <p className={_statusStyleHelper(status.type)}>{status.message}</p>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default PDFInput;
