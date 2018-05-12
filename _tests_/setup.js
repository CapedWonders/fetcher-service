import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import register from 'ignore-styles'

Enzyme.configure({ adapter: new Adapter() });


// ignore css files
register(['.css', '.sass', '.scss']);