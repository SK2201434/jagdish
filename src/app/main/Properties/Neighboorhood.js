import React from 'react';
import { useSelector } from 'react-redux';
import { selectProperties } from './PropertySlice1';
import Card from '@mui/material/Card';
import { Typography } from '@mui/material/';

const Neighborhood = () => {
    const propertyData = useSelector(selectProperties);

    const developments = propertyData?.data?.property?.developments;

    // Render only if developments array has items
    if (!developments || developments.length === 0) {
        return null; 
    }

    return (
        <div>
            <Card id="neighboorhood" className="card">
                <Typography variant='h6' sx={{margin:"25px 0px 0px 25px"}}>
                    Around The Property
                </Typography>
                <div style={{display:"flex", flexWrap:"wrap"}}>
                    {developments.map((item, index) => {
                        const trimmedItem = item
                        if (trimmedItem.length === 0) {
                            return null;
                        }
                        return (
                            <Card key={index} sx={{margin:"10px"}}>
                                <p style={{margin:"25px", textTransform:"capitalize"}}>
                                    {trimmedItem}
                                </p>
                            </Card>
                        );
                    })}
                </div>
            </Card>
        </div>
    );
};

export default Neighborhood;
