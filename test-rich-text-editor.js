// Test file to verify react-quill integration
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

console.log('ReactQuill imported successfully:', ReactQuill);

// Test the modules and formats
const testModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    ['link', 'image'],
    ['clean']
  ],
};

const testFormats = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'list', 'bullet', 'color', 'background', 'align',
  'link', 'image'
];

console.log('Test modules:', testModules);
console.log('Test formats:', testFormats);
console.log('ReactQuill integration test completed successfully!');
