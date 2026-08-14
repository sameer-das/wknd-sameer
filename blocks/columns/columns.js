export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col, index) => {
      console.log(col)
      col.classList.add(`col-${index}`)
      const pic = col.querySelector('picture');
      console.log(col ,index)
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });

  const ul = block.querySelector('.col-1 > ul');
  console.log(ul.children)
}
