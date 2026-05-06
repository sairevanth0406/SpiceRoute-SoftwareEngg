export default {
  name: 'foodItem',
  title: 'Food Item',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
    },
    {
      name: 'price',
      title: 'Price',
      type: 'number',
    },
    {
      name: 'calories',
      title: 'Calories',
      type: 'number',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Starter', value: 'starter' },
          { title: 'Main Course', value: 'main' },
          { title: 'Dessert', value: 'dessert' },
          { title: 'Beverage', value: 'beverage' },
          { title: 'Breakfast', value: 'breakfast' }
        ]
      }
    }
  ]
}