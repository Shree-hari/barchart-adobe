import addOnSandboxSdk from "add-on-sdk-document-sandbox";
import { editor, viewport } from "express-document-sdk";

const { runtime } = addOnSandboxSdk.instance;

// Resolve IDs while the visited page is active; retain no content references between calls.
function findInsertionParent(page, parentId) {
    const find = (node) => {
        if (node.id === parentId) return node;
        for (const child of node.allChildren || []) {
            const match = find(child);
            if (match) return match;
        }
        return null;
    };
    return find(page) || page.artboards.first;
}

function start() {
    const sandboxApi = {
        // Test function to verify sandbox is working
        testConnection: () => {
            return { success: true, message: "Sandbox is working!" };
        },

        // Add chart image to design using blob
        addChartToDesign: async (blob) => {
            try {
                
                
                if (!blob) {
                    console.error("❌ [Sandbox] No blob provided");
                    return { success: false, error: "No blob provided" };
                }
                
                // Get current page dimensions
                const currentPage = editor.context.currentPage;
                if (!currentPage) {
                    console.error("❌ [Sandbox] No current page found");
                    return { success: false, error: "No current page found" };
                }
                
                const pageWidth = currentPage.width;
                const pageHeight = currentPage.height;
                const centerX = pageWidth / 2;
                const centerY = pageHeight / 2;
                
                
                const parentId = editor.context.insertionParent.id;
                await editor.documentRoot.pages.visitPages([currentPage], async (activePage) => {
                    const parent = findInsertionParent(activePage, parentId);
                    const bitmapImage = await editor.loadBitmapImage(blob);
                    // Create image container without initialSize - uses bitmap's natural dimensions
                    // This ensures the aspect ratio matches exactly
                    const mediaContainer = editor.createImageContainer(bitmapImage);
                    
                    // Get the actual dimensions after creation to position it
                    const chartWidth = mediaContainer.width || 400;
                    const chartHeight = mediaContainer.height || 300;
                    
                    // Position chart at center
                    const chartX = centerX - chartWidth / 2;
                    const chartY = centerY - chartHeight / 2;
                    
                    
                    // Set position (centered)
                    mediaContainer.translation = { x: chartX, y: chartY };
                    
                    // Add to the current artboard
                    parent.children.append(mediaContainer);
                    
                    // Auto-select the newly created chart element
                    editor.context.selection = [mediaContainer];
                    
                    });
                
                
                // Return success - dimensions will be set by the container's natural size
                return { 
                    success: true, 
                    position: { x: centerX, y: centerY, width: 0, height: 0 }
                };
            } catch (error) {
                
                return { success: false, error: error.message || "Unknown error occurred" };
            }
        }
    };

    // Expose the API to the UI with explicit name
    runtime.exposeApi(sandboxApi, { name: "documentSandbox" });
}

start();

