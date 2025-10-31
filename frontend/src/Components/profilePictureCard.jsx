import mimtens from "../assets/mimtens.jpg";

function PhotoCard(props) {
    const src = props.avatarUrl || mimtens;
    return (
      <div className="flex flex-col items-center cursor-pointer">
        <img
          src={src}
          alt="Profile"
          className="w-16 h-16 rounded-full object-cover border-2 border-blue-200 shadow transition-transform duration-200 hover:scale-105 hover:shadow-xl"
        />
        <p className="mt-2 text-sm font-sans">{props.name || "Profile Photo"}</p>
      </div>
    );
}

export default PhotoCard;