'use client';

import { 
  Box, 
  Typography, 
  Paper, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import { ExpandMore, Add } from '@mui/icons-material';

export default function RulesSection() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Validation Rules
      </Typography>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Data Validation Rules
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Configure validation rules to ensure data quality and consistency across your datasets.
        </Typography>
        
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">Client Validation Rules</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Require Client ID to be unique"
              />
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Require Name field"
              />
              <FormControlLabel
                control={<Switch />}
                label="Validate email format"
              />
              <FormControlLabel
                control={<Switch />}
                label="Validate phone number format"
              />
            </Box>
          </AccordionDetails>
        </Accordion>
        
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">Worker Validation Rules</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Require Worker ID to be unique"
              />
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Require Name field"
              />
              <FormControlLabel
                control={<Switch />}
                label="Validate email format"
              />
              <FormControlLabel
                control={<Switch />}
                label="Require Department field"
              />
            </Box>
          </AccordionDetails>
        </Accordion>
        
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">Task Validation Rules</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Require Task ID to be unique"
              />
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Require Title field"
              />
              <FormControlLabel
                control={<Switch />}
                label="Validate Client ID exists in Clients table"
              />
              <FormControlLabel
                control={<Switch />}
                label="Validate Worker ID exists in Workers table"
              />
              <FormControlLabel
                control={<Switch />}
                label="Validate Due Date format"
              />
            </Box>
          </AccordionDetails>
        </Accordion>
        
        <Divider sx={{ my: 3 }} />
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button variant="contained" startIcon={<Add />}>
            Add Custom Rule
          </Button>
          <Button variant="outlined">
            Import Rules
          </Button>
          <Button variant="outlined">
            Export Rules
          </Button>
        </Box>
      </Paper>
    </Box>
  );
} 