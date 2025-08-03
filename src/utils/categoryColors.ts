// Define standard colors for each event category
export const categoryColors: Record<string, string> = {
  'retreat': '#e91e63',   // Pink
  'camp': '#2196f3',      // Blue
  'day-off': '#4caf50',   // Green
  'appointment': '#ff9800', // Orange
  'other': '#9c27b0'      // Purple
};

// Get color for a specific category
export function getCategoryColor(category: string): string {
  return categoryColors[category] || '#9c27b0'; // Default to purple if category not found
}