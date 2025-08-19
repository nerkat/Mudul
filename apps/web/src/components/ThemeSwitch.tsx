import { Box, FormControl, Select, MenuItem, Typography, useTheme } from '@mui/material';
import { useTheme as useAppTheme } from "../theme/hooks";
import type { Theme } from "../theme/types";

export function ThemeSwitch() {
  const theme = useTheme();
  const { theme: appTheme, setTheme } = useAppTheme();
  
  return (
    <Box sx={{ display: 'flex', gap: theme.spacing(2), alignItems: 'center' }}>
      <Typography variant="body2" color="text.secondary">
        Theme
      </Typography>
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <Select
          value={appTheme}
          onChange={(e) => setTheme(e.target.value as Theme)}
          sx={{
            borderRadius: theme.shape.borderRadius,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.divider,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main,
            }
          }}
          aria-label="Theme"
        >
          <MenuItem value="system">System</MenuItem>
          <MenuItem value="light">Light</MenuItem>
          <MenuItem value="dark">Dark</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}