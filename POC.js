/*Written by Saaransh to pull data from Google earth engine

Limited area pulled for an year worth of time, with specified dates.
Expected output - 36 time series images for the selected area, 36 mask images and a csv with list and metadata of all images.
Area cordinates are given in the comment - kindly use the same cordinates
*/


/* testArea has the following geometry : 

0: [145.35779313264436,-37.739031881743344]
1: [145.49554747743684,-37.74101094464846]
2: [145.49424091080425,-37.676235829533724]
3: [145.36082643068926,-37.674817714601495]
4: [145.35779313264436,-37.739031881743344]

 */

var area = ee.FeatureCollection(testArea);  // define and edit the geometry "testArea" in earth engine

var collection = ee.ImageCollection('LANDSAT/LC8_SR')
    .filterDate('2016-05-01', '2017-04-30')  // Making a collection of one year worth of data
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
Map.addLayer(collection.map(cropCollection).median(), vizParams);

// Taking only the image of Median NDVI of the selected area
//var image = ee.Image(collection.map(cropCollection).median());
//var ndvi = image.normalizedDifference(['B5', 'B4']);
//Map.addLayer(ndvi, {min: 0, max: 1}, 'NDVI');

// Export the image, specifying scale and region.
//Export.image.toDrive({
//  image: ndvi,
//  description: 'NDVI Image of the required area',
//  scale: 30,
//  region: area,
//  crs: 'EPSG:3857'
//});

// Export the image, specifying scale and region.
//Export.image.toDrive({
//  image: image,
//  description: 'RBG Image of the required area',
//  scale: 30,
//  region: area,
//  crs: 'EPSG:3857'
//});

var _collection = collection.getInfo();

Export.table.toDrive({
  collection: collection,
  description: _collection.id.split('/')[1],
  folder: 'earthengine_tables',
});

var imgs = _collection.features.map(function(img){
  return ee.Image.load(img.id);
});

imgs.forEach(function(img){
  Export.image.toDrive({
    image: img.select(['B5', 'B4', 'B3']),
    description: img.id().getInfo(),
    folder: 'earthengine_images',  // change here to choose output folder
    scale: 30,
    region: area,
    crs: 'EPSG:3857'
  });
  Export.image.toDrive({
    image: img.select(['cfmask', 'cfmask_conf']),
    description: img.id().getInfo(),
    folder: 'earthengine_masks',
    scale: 30,
    region: area,
    crs: 'EPSG:3857'
  });
});
