// "use client";

// import React from "react";
// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { toast } from "sonner";
// import {
//     Dialog,
//     DialogContent,
//     DialogHeader,
//     DialogTitle,
//     DialogDescription,
// } from "@/components/ui/dialog";
// import ProjectForm from "@/components/projects/ProjectForm";
// import { ProjectInput } from "@/lib/validations";
// import { ProjectStatus, ProjectPriority } from "@/types";

// interface ClientToProjectModalProps {
//     client: any;
//     isOpen: boolean;
//     onClose: () => void;
// }

// export default function ClientToProjectModal({
//     client,
//     isOpen,
//     onClose,
// }: ClientToProjectModalProps) {
//     const queryClient = useQueryClient();

//     const createProjectMutation = useMutation({
//         mutationFn: async (data: ProjectInput) => {
//             const res = await fetch("/api/projects", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify(data),
//             });

//             if (!res.ok) {
//                 const errData = await res.json().catch(() => ({}));
//                 throw new Error(
//                     errData.error ||
//                         errData.details ||
//                         "Failed to create project",
//                 );
//             }
//             return res.json();
//         },
//         onSuccess: () => {
//             toast.success("Project created successfully from client!");
//             // Invalidate projects query so the new project appears in the projects list
//             queryClient.invalidateQueries({ queryKey: ["projects"] });
//             onClose();
//         },
//         onError: (err: any) => toast.error(err.message),
//     });

//     if (!client) return null;

//     const initialData = {
//         clientName: client.name || "",
//         clientMobile: client.number || "",
//         clientSocialLink: client.socialMediaLink || "",
//         title: `${client.name} - New Project`,
//         status: ProjectStatus.TODO,
//         priority: ProjectPriority.MEDIUM,
//         budgetMin: client.minAmount || 0,
//         budgetMax: client.maxAmount || 0,
//     };

//     return (
//         <Dialog open={isOpen} onOpenChange={onClose}>
//             <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border shadow-2xl rounded-2xl">
//                 <DialogHeader className="mb-4">
//                     <DialogTitle className="text-2xl font-bold bg-linear-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
//                         Convert Client to Project
//                     </DialogTitle>
//                     <DialogDescription className="text-muted-foreground">
//                         Create a new project prefilled with {client.name}'s
//                         information. The original client will remain in your
//                         client list.
//                     </DialogDescription>
//                 </DialogHeader>

//                 <div className="mt-2">
//                     <ProjectForm
//                         initialData={initialData}
//                         onSubmit={(data) => createProjectMutation.mutate(data)}
//                         isLoading={createProjectMutation.isPending}
//                         onCancel={onClose}
//                     />
//                 </div>
//             </DialogContent>
//         </Dialog>
//     );
// }




"use client";

import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import ProjectForm from "@/components/projects/ProjectForm";
import { ProjectInput } from "@/lib/validations";
import { ProjectStatus, ProjectPriority } from "@/types";

interface ClientToProjectModalProps {
    client: any;
    isOpen: boolean;
    onClose: () => void;
}

export default function ClientToProjectModal({
    client,
    isOpen,
    onClose,
}: ClientToProjectModalProps) {
    const queryClient = useQueryClient();

    // Keep the last non-null client cached so the dialog's content
    // doesn't disappear mid-close-animation once `client` goes null.
    const [cachedClient, setCachedClient] = React.useState(client);

    React.useEffect(() => {
        if (client) {
            setCachedClient(client);
        }
    }, [client]);

    const createProjectMutation = useMutation({
        mutationFn: async (data: ProjectInput) => {
            const res = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(
                    errData.error ||
                        errData.details ||
                        "Failed to create project",
                );
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success("Project created successfully from client!");
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            onClose();
        },
        onError: (err: any) => toast.error(err.message),
    });

    const activeClient = client ?? cachedClient;

    if (!activeClient) return null;

    const initialData = {
        clientName: activeClient.name || "",
        clientMobile: activeClient.number || "",
        clientSocialLink: activeClient.socialMediaLink || "",
        title: `${activeClient.name} - New Project`,
        status: ProjectStatus.TODO,
        priority: ProjectPriority.MEDIUM,
        budgetMin: activeClient.minAmount || 0,
        budgetMax: activeClient.maxAmount || 0,
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DialogContent className="bg-card border-border text-foreground flex w-[95vw] max-w-4xl lg:max-w-5xl xl:max-w-6xl
                   max-h-[90vh] flex-col gap-0 overflow-hidden p-0">
                <DialogHeader className="shrink-0 border-b border-border px-6 py-5">
                    <DialogTitle className="text-2xl font-bold bg-linear-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                        Convert Client to Project
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Create a new project prefilled with {activeClient.name}'s
                        information. The original client will remain in your
                        client list.
                    </DialogDescription>
                </DialogHeader>

                {/* <div className="mt-2"> */}
                    <ProjectForm
                        initialData={initialData}
                        onSubmit={(data) => createProjectMutation.mutate(data)}
                        isLoading={createProjectMutation.isPending}
                        onCancel={onClose}
                    />
                {/* </div> */}
            </DialogContent>
        </Dialog>
    );
}