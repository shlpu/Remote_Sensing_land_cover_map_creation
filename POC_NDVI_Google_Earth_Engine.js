/* testArea has the following geometry : 

0: [145.35779313264436,-37.739031881743344]
1: [145.49554747743684,-37.74101094464846]
2: [145.49424091080425,-37.676235829533724]
3: [145.36082643068926,-37.674817714601495]
4: [145.35779313264436,-37.739031881743344]

 */

// define and edit the geometry "testArea" in earth engine
var area = ee.FeatureCollection(testArea);  

// Making a collection of one year worth of Landsat-8 Surface Reflection Data, with area filter
var collection = ee.ImageCollection('LANDSAT/LC8_SR')
    .filterDate('2016-05-01', '2017-04-30') 
    .filterBounds(area);

// This displays the metadata
print(collection);

// These are the default visiualization parameters
var vizParams = {
  min: 200,
  max: 2000,
  bands: ['B5', 'B4', 'B3']
};

// This function only shows the area which is selected
function cropCollection(collection) {
  return collection.clipToCollection(area);
}

// Using the median reducer here removes the clouds from the view
//Map.addLayer(collection.map(cropCollection).median(), vizParams);

// Taking only the image of Median NDVI of the selected area
var image = ee.Image(collection.map(cropCollection).median());
var ndvi = image.normalizedDifference(['B5', 'B4']);
Map.addLayer(ndvi, {min: 0, max: 1}, 'NDVI');

// Export the image, specifying scale and region.
Export.image.toDrive({
  image: ndvi,
  description: 'NDVI Image of the required area',
  scale: 30,
  region: area,
  crs: 'EPSG:3857'
});