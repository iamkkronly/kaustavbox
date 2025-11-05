"use client";

import { useState, useEffect, Fragment } from "react";
import { FolderIcon, DocumentIcon, ArrowUpIcon, EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { Dialog, Transition } from "@headlessui/react";
import InfiniteScroll from "react-infinite-scroll-component";

interface File {
  id: number;
  caption: string;
  date: number;
  size: number;
  type: "file" | "folder";
  name: string;
  hasThumbnail: boolean;
}

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [currentPath, setCurrentPath] = useState("/");
  const [newFolderName, setNewFolderName] = useState("");
  const [offsetId, setOffsetId] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileForModal, setFileForModal] = useState<File | null>(null);
  const [editingCaption, setEditingCaption] = useState(false);
  const [newCaption, setNewCaption] = useState("");
  const [totalSize, setTotalSize] = useState(0);

  useEffect(() => {
    Notification.requestPermission();
  }, []);

  const fetchFiles = async () => {
    try {
      const res = await fetch(`/api/files?path=${currentPath}&offsetId=${offsetId}`);
      const data = await res.json();
      if (data.success) {
        const processedFiles = data.files.map((file: any) => {
          const name = file.caption.replace("filestore4u_", "").replace(currentPath, "");
          return {
            ...file,
            name,
            type: file.name.endsWith("/") ? "folder" : "file",
          };
        });
        setFiles((prevFiles) => {
          const newFiles = processedFiles.filter(
            (newFile: File) => !prevFiles.some((prevFile) => prevFile.id === newFile.id)
          );
          return [...prevFiles, ...newFiles];
        });
        setOffsetId(data.nextOffsetId);
        setHasMore(data.files.length > 0);
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchStorage = async () => {
    try {
      const res = await fetch("/api/storage");
      const data = await res.json();
      if (data.success) {
        setTotalSize(data.totalSize);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    setFiles([]);
    setOffsetId(0);
    setHasMore(true);
    fetchFiles();
    fetchStorage();

    const interval = setInterval(() => {
      setOffsetId(0);
      fetchFiles();
      fetchStorage();
    }, 30000);

    return () => clearInterval(interval);
  }, [currentPath]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFile(e.target.files[0] as any);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("path", currentPath);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/files/upload", true);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        setUploadProgress(percentComplete);
      }
    };
    xhr.onload = () => {
      setUploading(false);
      if (xhr.status === 200) {
        setFiles([]);
        setOffsetId(0);
        fetchFiles();
        fetchStorage();
        new Notification("File uploaded successfully!");
      } else {
        setError("Upload failed.");
      }
    };
    xhr.onerror = () => {
      setUploading(false);
      setError("Upload failed.");
    };
    xhr.send(formData);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName) return;

    try {
      const res = await fetch("/api/folders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderName: newFolderName, currentPath }),
      });
      const data = await res.json();
      if (data.success) {
        setFiles([]);
        setOffsetId(0);
        fetchFiles();
        setNewFolderName("");
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (fileId: number) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;

    try {
      const res = await fetch("/api/files/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: fileId }),
      });
      const data = await res.json();
      if (data.success) {
        setFiles(files.filter((file) => file.id !== fileId));
        fetchStorage();
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = async () => {
    if (!fileForModal || !newCaption) return;

    try {
      const res = await fetch("/api/files/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: fileForModal.id, newCaption: `filestore4u_${currentPath}${newCaption}` }),
      });
      const data = await res.json();
      if (data.success) {
        setFiles([]);
        setOffsetId(0);
        fetchFiles();
        setIsModalOpen(false);
        setEditingCaption(false);
        setNewCaption("");
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDownload = (fileId: number) => {
    window.open(`/api/files/download/${fileId}`);
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="flex items-center justify-between p-4 bg-white shadow-md">
        <h1 className="text-xl font-bold">Kaustav Box</h1>
        <div>
          <p className="text-sm">
            {formatBytes(totalSize)} / 5 TB
          </p>
        </div>
        <div>
          <input type="file" onChange={handleFileChange} className="hidden" id="file-upload" />
          <label htmlFor="file-upload" className="px-4 py-2 mr-2 text-white bg-blue-500 rounded cursor-pointer">
            Choose File
          </label>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="px-4 py-2 text-white bg-blue-500 rounded disabled:bg-gray-400"
          >
            {uploading ? `Uploading... ${uploadProgress.toFixed(2)}%` : "Upload"}
          </button>
        </div>
      </header>
      <main className="flex-grow p-4 overflow-y-auto" id="scrollableDiv">
        {uploading && (
          <div className="w-full h-2 mb-4 bg-gray-200 rounded">
            <div
              className="h-2 bg-blue-500 rounded"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}
        {error && <p className="mb-4 text-red-500">{error}</p>}
        <div className="flex items-center mb-4">
          <input
            type="text"
            placeholder="New folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <button
            onClick={handleCreateFolder}
            className="p-2 ml-2 text-white bg-green-500 rounded"
          >
            Create Folder
          </button>
        </div>
        <div>
          <h2 className="mb-2 text-lg font-semibold">Current Path: {currentPath}</h2>
          <InfiniteScroll
            dataLength={files.length}
            next={fetchFiles}
            hasMore={hasMore}
            loader={<h4>Loading...</h4>}
            scrollableTarget="scrollableDiv"
          >
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {currentPath !== "/" && (
                <div
                  className="flex flex-col items-center justify-center p-4 border rounded cursor-pointer hover:bg-gray-200"
                  onClick={() => {
                    const parentPath = currentPath.split("/").filter(p => p).slice(0, -1).join("/") + "/";
                    setCurrentPath(parentPath === "/" ? "/" : `/${parentPath}`);
                  }}
                >
                  <ArrowUpIcon className="w-12 h-12 text-gray-500" />
                  <p className="mt-2 text-sm text-center">.. (Go back)</p>
                </div>
              )}
              {files.map((file) => (
                <div
                  key={file.id}
                  className="relative flex flex-col items-center justify-center p-4 border rounded cursor-pointer group hover:bg-gray-200"
                >
                  <div
                    className="absolute top-0 right-0 p-1 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFileForModal(file);
                      setIsModalOpen(true);
                      setNewCaption(file.name);
                    }}
                  >
                    <EllipsisVerticalIcon className="w-6 h-6 text-gray-500" />
                  </div>
                  <div
                    className="flex flex-col items-center justify-center w-full h-full"
                    onClick={() => {
                      if (file.type === "folder") {
                        setCurrentPath(`${currentPath}${file.name}`);
                      } else {
                        handleDownload(file.id);
                      }
                    }}
                  >
                    {file.type === "folder" ? (
                      <FolderIcon className="w-12 h-12 text-yellow-500" />
                    ) : file.hasThumbnail ? (
                      <img src={`/api/files/preview/${file.id}`} alt={file.name} className="object-cover w-12 h-12" />
                    ) : (
                      <DocumentIcon className="w-12 h-12 text-gray-500" />
                    )}
                    <p className="mt-2 text-sm text-center truncate">{file.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </InfiniteScroll>
        </div>
      </main>
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => {
          setIsModalOpen(false);
          setEditingCaption(false);
        }}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-full p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    File Options
                  </Dialog.Title>
                  <div className="mt-2">
                    {editingCaption ? (
                      <input
                        type="text"
                        value={newCaption}
                        onChange={(e) => setNewCaption(e.target.value)}
                        className="w-full p-2 border rounded"
                      />
                    ) : (
                      <p className="text-sm text-gray-500">
                        {fileForModal?.name}
                      </p>
                    )}
                  </div>

                  <div className="mt-4">
                    {editingCaption ? (
                      <button
                        type="button"
                        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-green-900 bg-green-100 border border-transparent rounded-md hover:bg-green-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                        onClick={handleEdit}
                      >
                        Save
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-blue-900 bg-blue-100 border border-transparent rounded-md hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        onClick={() => setEditingCaption(true)}
                      >
                        Edit
                      </button>
                    )}
                    <button
                      type="button"
                      className="inline-flex justify-center px-4 py-2 ml-2 text-sm font-medium text-red-900 bg-red-100 border border-transparent rounded-md hover:bg-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                      onClick={() => {
                        if (fileForModal) {
                          handleDelete(fileForModal.id);
                        }
                        setIsModalOpen(false);
                      }}
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center px-4 py-2 ml-2 text-sm font-medium text-gray-900 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                      onClick={() => {
                        setIsModalOpen(false)
                        setEditingCaption(false)
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
